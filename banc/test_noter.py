"""Tests de l'outil de notation. Les sorties de modèles ci-dessous sont écrites à la main pour les tests."""

import json
import pathlib
import shutil
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

import noter

ICI = pathlib.Path(__file__).parent


def fausse_sortie(nom, questions):
    return {
        "modele": {"nom": nom},
        "questions_par_passage": 2,
        "appels": [{"passage_id": "p1", "brut": json.dumps({"questions": questions}), "duree_s": 1}],
    }


def q(enonce, bonne=0):
    return {"question": enonce, "choix": ["Huit", "Six", "Dix", "Douze"], "bonne_reponse": bonne, "citation": "x"}


class Notation(unittest.TestCase):
    def setUp(self):
        self.dossier = pathlib.Path(tempfile.mkdtemp())
        shutil.copy(ICI / "cours.md", self.dossier / "cours.md")
        (self.dossier / "sorties").mkdir()
        a = fausse_sortie("modele-a", [q("Combien de critères principaux ?"), {"question": "Mal formée", "choix": ["a"], "bonne_reponse": 0, "citation": ""}])
        b = fausse_sortie("modele-b", [q("En quelle année le rapport est-il publié ?"), q("Qui a proposé la grille ?")])
        (self.dossier / "sorties" / "a.json").write_text(json.dumps(a), encoding="utf-8")
        (self.dossier / "sorties" / "b.json").write_text(json.dumps(b), encoding="utf-8")
        self.notes = self.dossier / "notes_humaines.json"
        self.questions = noter.questions_a_noter(self.dossier)
        self.addCleanup(shutil.rmtree, self.dossier)

    def test_masque_le_modele_et_ecarte_les_questions_illisibles(self):
        self.assertEqual(len(self.questions), 3)
        for question in self.questions:
            self.assertNotIn("modele", question)
            self.assertNotIn("modele-", json.dumps(question))

    def test_ordre_melange_mais_reproductible(self):
        self.assertEqual([x["id"] for x in self.questions], [x["id"] for x in noter.questions_a_noter(self.dossier)])

    def test_refuse_une_note_incomplete_ou_inconnue(self):
        ids = {x["id"] for x in self.questions}
        un = self.questions[0]["id"]
        self.assertEqual(noter.enregistrer_note({"id": "zzz", "verdict": "garder", "juste": True, "unique": True}, ids, self.notes), "question inconnue")
        self.assertEqual(noter.enregistrer_note({"id": un, "verdict": "bof", "juste": True, "unique": True}, ids, self.notes), "verdict manquant")
        self.assertEqual(noter.enregistrer_note({"id": un, "verdict": "garder", "juste": "oui", "unique": True}, ids, self.notes), "réponses oui/non manquantes")
        self.assertFalse(self.notes.exists())

    def test_enregistre_puis_remplace_une_note(self):
        ids = {x["id"] for x in self.questions}
        un = self.questions[0]["id"]
        self.assertIsNone(noter.enregistrer_note({"id": un, "verdict": "garder", "juste": True, "unique": True}, ids, self.notes))
        self.assertIsNone(noter.enregistrer_note({"id": un, "verdict": "jeter", "juste": False, "unique": True, "commentaire": " hors sujet "}, ids, self.notes))
        notes = noter.lire_notes(self.notes)["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[un]["verdict"], "jeter")
        self.assertEqual(notes[un]["commentaire"], "hors sujet")

    def test_le_serveur_sert_la_page_et_enregistre_une_note(self):
        serveur = noter.serveur(self.questions, self.notes, port=0)
        base = f"http://127.0.0.1:{serveur.server_address[1]}"
        threading.Thread(target=serveur.serve_forever, daemon=True).start()
        self.addCleanup(serveur.server_close)
        self.addCleanup(serveur.shutdown)

        page = urllib.request.urlopen(base + "/").read().decode("utf-8")
        self.assertIn("Notation des QCM", page)
        etat = json.loads(urllib.request.urlopen(base + "/api/etat").read())
        self.assertEqual(len(etat["questions"]), 3)

        def poster(note):
            requete = urllib.request.Request(base + "/api/note", data=json.dumps(note).encode(), headers={"Content-Type": "application/json"})
            return urllib.request.urlopen(requete).status

        un = etat["questions"][0]["id"]
        self.assertEqual(poster({"id": un, "verdict": "corriger", "juste": True, "unique": False}), 200)
        with self.assertRaises(urllib.error.HTTPError):
            poster({"id": un, "verdict": "garder"})
        etat = json.loads(urllib.request.urlopen(base + "/api/etat").read())
        self.assertEqual(etat["notes"][un]["verdict"], "corriger")


if __name__ == "__main__":
    unittest.main()
