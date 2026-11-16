"""Tests de l'évaluation automatique. Les questions ci-dessous sont écrites à la main pour les tests."""

import json
import pathlib
import tempfile
import unittest

import evaluer
from generer import lire_cours

PASSAGE = (
    "La grille compte huit critères principaux, dont certains se divisent en sous-critères, "
    "pour un total de dix-huit critères élémentaires. Elle est surtout utilisée en inspection ergonomique."
)


def question(**remplacements):
    base = {
        "question": "Combien de critères principaux compte la grille ?",
        "choix": ["Six critères", "Huit critères", "Dix critères", "Douze critères"],
        "bonne_reponse": 1,
        "citation": "La grille compte huit critères principaux",
    }
    return {**base, **remplacements}


class ExtraireQuestions(unittest.TestCase):
    def test_lit_un_objet_json(self):
        questions, raison = evaluer.extraire_questions(json.dumps({"questions": [question()]}))
        self.assertIsNone(raison)
        self.assertEqual(len(questions), 1)

    def test_lit_un_json_entoure_de_texte_ou_de_balises(self):
        brut = "Voici les questions :\n```json\n" + json.dumps({"questions": [question()]}) + "\n```"
        self.assertEqual(len(evaluer.extraire_questions(brut)[0]), 1)

    def test_signale_un_json_tronque(self):
        self.assertEqual(evaluer.extraire_questions('{"questions": [{"question": "coup')[1], "JSON illisible")

    def test_signale_une_reponse_vide_ou_sans_liste(self):
        self.assertEqual(evaluer.extraire_questions("  ")[1], "réponse vide")
        self.assertEqual(evaluer.extraire_questions('{"reponse": 3}')[1], "pas de liste de questions")


class Controles(unittest.TestCase):
    def test_format_valide(self):
        self.assertTrue(evaluer.format_valide(question()))

    def test_format_refuse_trois_propositions(self):
        self.assertFalse(evaluer.format_valide(question(choix=["a", "b", "c"])))

    def test_format_refuse_deux_propositions_identiques(self):
        self.assertFalse(evaluer.format_valide(question(choix=["Huit", "huit ", "Dix", "Douze"])))

    def test_format_refuse_une_position_hors_bornes_ou_mal_typee(self):
        self.assertFalse(evaluer.format_valide(question(bonne_reponse=4)))
        self.assertFalse(evaluer.format_valide(question(bonne_reponse="1")))
        self.assertFalse(evaluer.format_valide(question(bonne_reponse=True)))

    def test_citation_fidele_tolere_casse_apostrophes_et_espaces(self):
        passage = "L’incitation indique à l’utilisateur ce qu’il peut faire et où il se trouve."
        q = question(citation="l'incitation indique à  l'utilisateur ce qu'il peut faire")
        self.assertTrue(evaluer.citation_fidele(q, passage))

    def test_citation_inventee_ou_reformulee(self):
        q = question(citation="La grille contient huit grands critères principaux")
        self.assertFalse(evaluer.citation_fidele(q, PASSAGE))

    def test_citation_trop_courte(self):
        self.assertFalse(evaluer.citation_fidele(question(citation="huit critères"), PASSAGE))

    def test_reponse_appuyee_par_la_citation(self):
        self.assertTrue(evaluer.reponse_appuyee(question()))

    def test_reponse_en_chiffres_et_citation_en_lettres(self):
        # Cas rencontré sur une vraie sortie : réponse « 18 », cours « dix-huit ».
        q = question(choix=["8", "16", "18", "20"], bonne_reponse=2, citation="pour un total de dix-huit critères élémentaires")
        self.assertTrue(evaluer.reponse_appuyee(q))
        self.assertFalse(evaluer.reponse_appuyee({**q, "bonne_reponse": 0}))

    def test_reponse_absente_de_la_citation(self):
        q = question(citation="Elle est surtout utilisée en inspection ergonomique")
        self.assertFalse(evaluer.reponse_appuyee(q))

    def test_indice_de_longueur(self):
        q = question(choix=["Six", "Huit critères principaux répartis en plusieurs familles distinctes", "Dix", "Douze"])
        self.assertFalse(evaluer.sans_indice_longueur(q))
        self.assertTrue(evaluer.sans_indice_longueur(question()))

    def test_ressemblance(self):
        a = "Combien de critères principaux compte la grille ?"
        self.assertGreaterEqual(evaluer.ressemblance(a, "Combien de critères principaux la grille compte-t-elle ?"), 0.7)
        self.assertLess(evaluer.ressemblance(a, "À quoi sert l'inspection ergonomique ?"), 0.3)


class EvaluerModele(unittest.TestCase):
    passages = {"p1": {"id": "p1", "titre": "Origine", "texte": PASSAGE}}

    def sortie(self, *appels):
        return {"modele": {"nom": "test:latest"}, "questions_par_passage": 2, "appels": list(appels)}

    def appel(self, questions, **champs):
        return {"passage_id": "p1", "brut": json.dumps({"questions": questions}), "duree_s": 10, "jetons_generes": 200, "duree_generation_ns": 4_000_000_000, **champs}

    def test_compte_les_controles_et_les_positions(self):
        bonne = question()
        inventee = question(question="À quoi sert la grille ?", citation="Elle sert à noter les utilisateurs sur dix", bonne_reponse=3)
        resume, questions = evaluer.evaluer_modele(self.sortie(self.appel([bonne, inventee])), self.passages)
        self.assertEqual(resume["questions_obtenues"], 2)
        self.assertEqual(resume["controles"]["citation_fidele"], 1)
        self.assertEqual(resume["tous_controles"], 1)
        self.assertEqual(resume["positions_bonne_reponse"], [0, 1, 0, 1])
        self.assertEqual(resume["jetons_par_seconde"], 50.0)
        self.assertTrue(questions[0]["tous_controles"])

    def test_reperer_un_doublon(self):
        _, questions = evaluer.evaluer_modele(self.sortie(self.appel([question(), question()])), self.passages)
        self.assertTrue(questions[0]["mesures"]["sans_doublon"])
        self.assertFalse(questions[1]["mesures"]["sans_doublon"])

    def test_une_reponse_illisible_compte_comme_un_echec(self):
        resume, questions = evaluer.evaluer_modele(self.sortie({"passage_id": "p1", "brut": "{coupé", "duree_s": 3}), self.passages)
        self.assertEqual(questions, [])
        self.assertEqual(resume["questions_attendues"], 2)
        self.assertEqual(resume["echecs"], [{"passage_id": "p1", "raison": "JSON illisible"}])

    def test_ne_juge_que_le_nombre_de_questions_demande(self):
        trois = [question(), question(question="Autre énoncé sans rapport ?"), question(question="Troisième énoncé différent ?")]
        resume, _ = evaluer.evaluer_modele(self.sortie(self.appel(trois)), self.passages)
        self.assertEqual(resume["questions_obtenues"], 2)

    def test_identifiants_stables(self):
        _, a = evaluer.evaluer_modele(self.sortie(self.appel([question()])), self.passages)
        _, b = evaluer.evaluer_modele(self.sortie(self.appel([question()])), self.passages)
        self.assertEqual(a[0]["id"], b[0]["id"])


class NotesEtComparaison(unittest.TestCase):
    def test_croise_jugement_humain_et_controles(self):
        questions = [
            {"id": "a", "tous_controles": True},
            {"id": "b", "tous_controles": True},
            {"id": "c", "tous_controles": False},
            {"id": "d", "tous_controles": False},
        ]
        notes = {"a": {"verdict": "garder"}, "b": {"verdict": "jeter"}, "c": {"verdict": "corriger"}}
        resultat = evaluer.comparer(questions, notes)
        self.assertEqual(resultat["questions_notees"], 3)
        self.assertEqual(resultat["auto_ok_humain_garder"], 1)
        self.assertEqual(resultat["auto_ok_humain_rejet"], 1)
        self.assertEqual(resultat["auto_ko_humain_rejet"], 1)
        self.assertEqual(resultat["accord"], 0.67)

    def test_ignore_les_notes_de_questions_disparues_ou_mal_formees(self):
        with tempfile.TemporaryDirectory() as dossier:
            chemin = pathlib.Path(dossier) / "notes_humaines.json"
            chemin.write_text(json.dumps({"notes": {"a": {"verdict": "garder"}, "z": {"verdict": "garder"}, "b": {"verdict": "bof"}}}), encoding="utf-8")
            self.assertEqual(list(evaluer.charger_notes(chemin, {"a", "b"})), ["a"])


class Cours(unittest.TestCase):
    def test_le_cours_se_decoupe_en_passages(self):
        cours = lire_cours(pathlib.Path(__file__).parent / "cours.md")
        self.assertEqual([p["id"] for p in cours["passages"]], ["p1", "p2", "p3", "p4", "p5", "p6"])
        self.assertTrue(all(len(p["texte"]) > 300 for p in cours["passages"]))


if __name__ == "__main__":
    unittest.main()
