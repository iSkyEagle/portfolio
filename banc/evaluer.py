#!/usr/bin/env python3
"""Évalue les QCM générés par generer.py et produit resultats.json.

Usage :
    python evaluer.py

Le script ne rappelle aucun modèle : il lit les réponses brutes de sorties/,
applique des contrôles automatiques à chaque question, puis ajoute les notes
humaines de notes_humaines.json quand elles existent (voir noter.py).

Les contrôles automatiques sont volontairement simples. Ils repèrent les défauts
de forme et les citations inventées. Ils ne disent pas si une question est juste
ou utile : c'est le rôle de la notation humaine, et l'écart entre les deux est
justement ce que le banc cherche à montrer.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import pathlib
import re
import sys
import unicodedata

from generer import lire_cours

ICI = pathlib.Path(__file__).resolve().parent

LONGUEUR_MIN_CITATION = 20
SEUIL_APPUI = 0.5
SEUIL_DOUBLON = 0.7
VERDICTS = ("garder", "corriger", "jeter")

MOTS_VIDES = {
    "les", "des", "une", "est", "que", "qui", "par", "pour", "dans", "sur", "avec", "aux", "ses", "son",
    "sont", "pas", "plus", "elle", "ils", "leur", "leurs", "cette", "ces", "tout", "tous", "entre", "comme",
    "ainsi", "afin", "dont", "aussi", "être", "fait", "the", "and",
}

# Libellés affichés sur le site et dans le terminal.
CONTROLES = {
    "format_valide": "Format valide (énoncé, quatre propositions distinctes, une bonne réponse)",
    "citation_fidele": "Citation présente mot pour mot dans le passage",
    "reponse_appuyee": "Bonne réponse retrouvée dans la citation",
    "sans_indice_longueur": "Bonne réponse pas nettement plus longue que les autres",
    "sans_doublon": "Question distincte des autres questions du même modèle",
}


def normaliser(texte: str) -> str:
    """Ramène un texte à une forme comparable : casse, apostrophes, guillemets et espaces unifiés."""
    texte = unicodedata.normalize("NFC", texte).lower()
    texte = texte.replace("’", "'").replace("‘", "'").replace(" ", " ").replace(" ", " ")
    texte = re.sub(r"[«»“”\"]", "", texte)
    texte = re.sub(r"\s+", " ", texte)
    return texte.strip(" .;:,!?")


def mots(texte: str) -> list[str]:
    """Mots porteurs de sens : au moins trois lettres, ou un nombre, hors mots vides."""
    trouves = re.findall(r"[a-zàâäçéèêëîïôöùûüœ]+|\d+", normaliser(texte))
    return [m for m in trouves if (m.isdigit() or len(m) >= 3) and m not in MOTS_VIDES]


def extraire_questions(brut: str) -> tuple[list, str | None]:
    """Lit la réponse brute d'un modèle. Renvoie les questions et, en cas d'échec, la raison."""
    if not brut or not brut.strip():
        return [], "réponse vide"
    candidat = brut.strip()
    bloc = re.search(r"```(?:json)?\s*(.+?)```", candidat, re.S)
    if bloc:
        candidat = bloc.group(1).strip()
    try:
        donnees = json.loads(candidat)
    except json.JSONDecodeError:
        debut, fin = candidat.find("{"), candidat.rfind("}")
        if debut == -1 or fin <= debut:
            return [], "JSON illisible"
        try:
            donnees = json.loads(candidat[debut : fin + 1])
        except json.JSONDecodeError:
            return [], "JSON illisible"
    if isinstance(donnees, dict):
        donnees = donnees.get("questions")
    if not isinstance(donnees, list):
        return [], "pas de liste de questions"
    return [q for q in donnees if isinstance(q, dict)], None


def format_valide(q: dict) -> bool:
    enonce, choix, bonne = q.get("question"), q.get("choix"), q.get("bonne_reponse")
    if not isinstance(enonce, str) or not enonce.strip():
        return False
    if not isinstance(choix, list) or len(choix) != 4:
        return False
    if not all(isinstance(c, str) and c.strip() for c in choix):
        return False
    if len({normaliser(c) for c in choix}) != 4:
        return False
    return isinstance(bonne, int) and not isinstance(bonne, bool) and 0 <= bonne <= 3


def citation_fidele(q: dict, passage: str) -> bool:
    citation = q.get("citation")
    if not isinstance(citation, str):
        return False
    citation = normaliser(citation)
    return len(citation) >= LONGUEUR_MIN_CITATION and citation in normaliser(passage)


def reponse_appuyee(q: dict) -> bool:
    """La moitié au moins des mots de la bonne réponse se retrouvent dans la citation.

    Deux mots sont rapprochés par leurs cinq premières lettres, pour tolérer
    les accords (« critère » et « critères »).
    """
    bonne = mots(q["choix"][q["bonne_reponse"]])
    citation = {m[:5] for m in mots(q.get("citation") or "")}
    if not bonne or not citation:
        return False
    return sum(m[:5] in citation for m in bonne) / len(bonne) >= SEUIL_APPUI


def sans_indice_longueur(q: dict) -> bool:
    """Défaut classique de rédaction : la bonne réponse se devine parce qu'elle est la plus longue."""
    longueurs = [len(c.strip()) for c in q["choix"]]
    bonne = longueurs[q["bonne_reponse"]]
    autres = [n for i, n in enumerate(longueurs) if i != q["bonne_reponse"]]
    moyenne = sum(autres) / len(autres)
    return bonne <= 1.5 * moyenne or bonne - moyenne < 15


def ressemblance(a: str, b: str) -> float:
    """Indice de Jaccard entre les mots de deux énoncés."""
    ma, mb = set(mots(a)), set(mots(b))
    return len(ma & mb) / len(ma | mb) if ma and mb else 0.0


def identifiant(modele: str, passage_id: str, rang: int) -> str:
    return "q" + hashlib.sha1(f"{modele}|{passage_id}|{rang}".encode()).hexdigest()[:8]


def evaluer_modele(sortie: dict, passages: dict[str, dict]) -> tuple[dict, list[dict]]:
    """Applique les contrôles à toutes les questions d'un modèle."""
    nom = sortie["modele"]["nom"]
    attendues_par_appel = sortie.get("questions_par_passage", 2)
    questions: list[dict] = []
    appels_lisibles = 0
    echecs: list[dict] = []
    jetons = duree_ns = 0
    durees = []

    for appel in sortie["appels"]:
        passage = passages.get(appel["passage_id"])
        if passage is None:
            continue
        if "erreur" in appel:
            echecs.append({"passage_id": appel["passage_id"], "raison": appel["erreur"]})
            continue
        durees.append(appel.get("duree_s") or 0)
        jetons += appel.get("jetons_generes") or 0
        duree_ns += appel.get("duree_generation_ns") or 0
        brutes, raison = extraire_questions(appel.get("brut", ""))
        if raison:
            echecs.append({"passage_id": appel["passage_id"], "raison": raison})
            continue
        appels_lisibles += 1
        # Un modèle qui écrit plus de questions que demandé n'est jugé que sur les premières.
        for rang, q in enumerate(brutes[:attendues_par_appel]):
            valide = format_valide(q)
            mesures = {
                "format_valide": valide,
                "citation_fidele": citation_fidele(q, passage["texte"]),
                "reponse_appuyee": valide and reponse_appuyee(q),
                "sans_indice_longueur": valide and sans_indice_longueur(q),
                "sans_doublon": True,
            }
            questions.append(
                {
                    "id": identifiant(nom, passage["id"], rang),
                    "modele": nom,
                    "passage_id": passage["id"],
                    "question": q.get("question") if isinstance(q.get("question"), str) else "",
                    "choix": [c for c in q.get("choix", []) if isinstance(c, str)] if isinstance(q.get("choix"), list) else [],
                    "bonne_reponse": q.get("bonne_reponse") if valide else None,
                    "citation": q.get("citation") if isinstance(q.get("citation"), str) else "",
                    "mesures": mesures,
                }
            )

    # Doublons : une question trop proche d'une question précédente du même modèle.
    for i, q in enumerate(questions):
        if any(ressemblance(q["question"], p["question"]) >= SEUIL_DOUBLON for p in questions[:i]):
            q["mesures"]["sans_doublon"] = False
    for q in questions:
        q["tous_controles"] = all(q["mesures"].values())

    attendues = len(sortie["appels"]) * attendues_par_appel
    valides = [q for q in questions if q["mesures"]["format_valide"]]
    positions = [0, 0, 0, 0]
    for q in valides:
        positions[q["bonne_reponse"]] += 1

    resume = {
        **sortie["modele"],
        "ollama": sortie.get("ollama", ""),
        "date": sortie.get("date", ""),
        "appels": len(sortie["appels"]),
        "appels_lisibles": appels_lisibles,
        "echecs": echecs,
        "questions_attendues": attendues,
        "questions_obtenues": len(questions),
        "controles": {nom_controle: sum(q["mesures"][nom_controle] for q in questions) for nom_controle in CONTROLES},
        "tous_controles": sum(q["tous_controles"] for q in questions),
        "positions_bonne_reponse": positions,
        "duree_moyenne_s": round(sum(durees) / len(durees), 1) if durees else None,
        "jetons_par_seconde": round(jetons / (duree_ns / 1e9), 1) if duree_ns else None,
    }
    return resume, questions


def charger_notes(chemin: pathlib.Path, ids_connus: set[str]) -> dict:
    """Notes humaines valides, limitées aux questions qui existent encore."""
    if not chemin.exists():
        return {}
    brutes = json.loads(chemin.read_text(encoding="utf-8")).get("notes", {})
    return {
        qid: note
        for qid, note in brutes.items()
        if qid in ids_connus and note.get("verdict") in VERDICTS
    }


def comparer(questions: list[dict], notes: dict) -> dict:
    """Croise le jugement humain et les contrôles automatiques sur les questions notées."""
    tableau = {"auto_ok_humain_garder": 0, "auto_ok_humain_rejet": 0, "auto_ko_humain_garder": 0, "auto_ko_humain_rejet": 0}
    for q in questions:
        note = notes.get(q["id"])
        if not note:
            continue
        cle = ("auto_ok" if q["tous_controles"] else "auto_ko") + ("_humain_garder" if note["verdict"] == "garder" else "_humain_rejet")
        tableau[cle] += 1
    total = sum(tableau.values())
    accord = tableau["auto_ok_humain_garder"] + tableau["auto_ko_humain_rejet"]
    return {**tableau, "questions_notees": total, "accord": round(accord / total, 2) if total else None}


def construire(dossier: pathlib.Path = ICI) -> dict:
    cours = lire_cours(dossier / "cours.md")
    passages = {p["id"]: p for p in cours["passages"]}
    modeles, questions = [], []
    for fichier in sorted((dossier / "sorties").glob("*.json")):
        resume, qs = evaluer_modele(json.loads(fichier.read_text(encoding="utf-8")), passages)
        modeles.append(resume)
        questions.extend(qs)

    notes = charger_notes(dossier / "notes_humaines.json", {q["id"] for q in questions})
    for modele in modeles:
        siennes = [notes[q["id"]] for q in questions if q["modele"] == modele["nom"] and q["id"] in notes]
        modele["notes_humaines"] = {
            "questions_notees": len(siennes),
            **{v: sum(n["verdict"] == v for n in siennes) for v in VERDICTS},
            "reponse_juste": sum(bool(n.get("juste")) for n in siennes),
            "reponse_unique": sum(bool(n.get("unique")) for n in siennes),
        }

    return {
        "genere_le": datetime.datetime.now().isoformat(timespec="seconds"),
        "cours": cours,
        "controles": CONTROLES,
        "modeles": modeles,
        "questions": questions,
        "notes": notes,
        "comparaison": comparer(questions, notes),
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not (ICI / "sorties").exists():
        print("Aucune sortie à évaluer : lancez d'abord generer.py.")
        return 1
    resultats = construire()
    (ICI / "resultats.json").write_text(json.dumps(resultats, ensure_ascii=False, indent=2), encoding="utf-8")

    for m in resultats["modeles"]:
        print(f"{m['nom']} · {m['questions_obtenues']}/{m['questions_attendues']} questions · {m['tous_controles']} passent tous les contrôles")
        for cle, libelle in CONTROLES.items():
            print(f"    {m['controles'][cle]:>2}  {libelle}")
        for e in m["echecs"]:
            print(f"    échec sur {e['passage_id']} : {e['raison']}")
    c = resultats["comparaison"]
    if c["questions_notees"]:
        print(f"\nNotation humaine : {c['questions_notees']} questions notées, accord avec les contrôles automatiques {c['accord']:.0%}")
    else:
        print("\nPas encore de notation humaine : lancez noter.py.")
    print("Résultats écrits dans resultats.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
