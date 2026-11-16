#!/usr/bin/env python3
"""Génère des QCM à partir d'un cours, avec des modèles exécutés en local par Ollama.

Usage :
    python generer.py                  utilise les modèles installés (4 au plus)
    python generer.py mistral gemma3   utilise les modèles nommés

Chaque modèle reçoit le même passage, la même consigne et les mêmes réglages.
Les réponses brutes sont enregistrées telles quelles dans sorties/ : l'évaluation
(evaluer.py) se fait ensuite, sans rappeler les modèles.
Le script n'utilise que la bibliothèque standard de Python.
"""

from __future__ import annotations

import datetime
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

ICI = pathlib.Path(__file__).resolve().parent
OLLAMA = "http://localhost:11434"
QUESTIONS_PAR_PASSAGE = 2
MAX_MODELES = 4
DELAI_MAX_S = 900

# Réglages identiques pour tous les modèles : température nulle et graine fixe,
# pour qu'une nouvelle génération donne le même résultat.
REGLAGES = {"temperature": 0, "seed": 42, "num_predict": 1200}

CONSIGNE_SYSTEME = (
    "Tu rédiges des questions à choix multiples pour aider un étudiant à réviser un cours. "
    "Tu t'appuies uniquement sur le passage fourni. Tu n'ajoutes aucune connaissance extérieure."
)

CONSIGNE = """Voici un passage de cours.

<passage>
{passage}
</passage>

Rédige exactement {n} questions à choix multiples sur ce passage, en français.
Pour chaque question :
- "question" : l'énoncé de la question ;
- "choix" : quatre propositions, dont une seule est juste d'après le passage ;
- "bonne_reponse" : la position de la proposition juste, de 0 à 3 ;
- "citation" : la phrase du passage, recopiée mot pour mot, qui justifie la bonne réponse.

Réponds uniquement avec un objet JSON de la forme {{"questions": [...]}}."""

SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "choix": {"type": "array", "items": {"type": "string"}},
                    "bonne_reponse": {"type": "integer"},
                    "citation": {"type": "string"},
                },
                "required": ["question", "choix", "bonne_reponse", "citation"],
            },
        }
    },
    "required": ["questions"],
}


def lire_cours(chemin: pathlib.Path) -> dict:
    """Découpe le cours en passages. Un passage commence par « ## identifiant · titre »."""
    texte = chemin.read_text(encoding="utf-8")
    titre = re.search(r"^# (.+)$", texte, re.M)
    passages = []
    for bloc in re.split(r"^## ", texte, flags=re.M)[1:]:
        entete, _, corps = bloc.partition("\n")
        identifiant, _, nom = entete.partition("·")
        passages.append({"id": identifiant.strip(), "titre": nom.strip(), "texte": corps.strip()})
    return {"titre": titre.group(1).strip() if titre else "", "passages": passages}


def appel_http(chemin: str, corps: dict | None = None, delai: int = 30) -> dict:
    donnees = json.dumps(corps).encode("utf-8") if corps is not None else None
    requete = urllib.request.Request(
        OLLAMA + chemin, data=donnees, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(requete, timeout=delai) as reponse:
        return json.loads(reponse.read().decode("utf-8"))


def modeles_installes() -> list[dict]:
    """Modèles de génération installés, Mistral d'abord puis du plus léger au plus lourd."""
    modeles = []
    for m in appel_http("/api/tags").get("models", []):
        nom = m.get("name", "")
        famille = (m.get("details") or {}).get("family", "")
        if "embed" in nom or famille in {"bert", "nomic-bert"}:
            continue  # modèle d'embeddings : il ne génère pas de texte
        modeles.append(
            {
                "nom": nom,
                "empreinte": m.get("digest", "")[:12],
                "taille_go": round(m.get("size", 0) / 1e9, 1),
                "parametres": (m.get("details") or {}).get("parameter_size", ""),
                "quantification": (m.get("details") or {}).get("quantization_level", ""),
            }
        )
    modeles.sort(key=lambda m: (not m["nom"].startswith("mistral"), m["taille_go"]))
    return modeles


def nom_fichier(modele: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "_", modele) + ".json"


def generer(modele: str, passage: dict) -> dict:
    """Un appel au modèle pour un passage. La réponse est gardée brute, même si elle est mal formée."""
    corps = {
        "model": modele,
        "stream": False,
        "format": SCHEMA,
        "options": REGLAGES,
        "messages": [
            {"role": "system", "content": CONSIGNE_SYSTEME},
            {"role": "user", "content": CONSIGNE.format(passage=passage["texte"], n=QUESTIONS_PAR_PASSAGE)},
        ],
    }
    debut = time.time()
    try:
        try:
            reponse = appel_http("/api/chat", corps, DELAI_MAX_S)
        except urllib.error.HTTPError as erreur:
            if erreur.code != 400:
                raise
            # Version d'Ollama sans sortie structurée par schéma : on demande du JSON simple.
            corps["format"] = "json"
            reponse = appel_http("/api/chat", corps, DELAI_MAX_S)
    except Exception as erreur:  # réseau, délai dépassé, modèle introuvable
        return {"passage_id": passage["id"], "erreur": f"{type(erreur).__name__}: {erreur}", "duree_s": round(time.time() - debut, 1)}
    return {
        "passage_id": passage["id"],
        "brut": (reponse.get("message") or {}).get("content", ""),
        "duree_s": round(time.time() - debut, 1),
        "jetons_generes": reponse.get("eval_count"),
        "duree_generation_ns": reponse.get("eval_duration"),
        "format_demande": "schema" if isinstance(corps["format"], dict) else "json",
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    cours = lire_cours(ICI / "cours.md")
    try:
        version = appel_http("/api/version").get("version", "")
        installes = modeles_installes()
    except Exception as erreur:
        print(f"Ollama ne répond pas sur {OLLAMA} ({erreur}).")
        print("Lancez l'application Ollama, puis relancez ce script.")
        return 1

    demandes = sys.argv[1:]
    if demandes:
        choisis = [m for m in installes if any(m["nom"] == d or m["nom"].split(":")[0] == d for d in demandes)]
        absents = [d for d in demandes if not any(m["nom"] == d or m["nom"].split(":")[0] == d for m in choisis)]
        if absents:
            print("Modèles non installés :", ", ".join(absents))
            print("Modèles installés :", ", ".join(m["nom"] for m in installes) or "aucun")
            return 1
    else:
        choisis = installes[:MAX_MODELES]

    if not choisis:
        print("Aucun modèle de génération installé. Exemple : ollama pull mistral")
        return 1

    print(f"Ollama {version} · cours : {cours['titre']} ({len(cours['passages'])} passages)")
    print("Modèles :", ", ".join(f"{m['nom']} ({m['taille_go']} Go)" for m in choisis))
    if len(choisis) < 2:
        print("Un seul modèle : le banc compare mieux avec deux ou trois. Exemple : ollama pull llama3.2")
    print()

    sorties = ICI / "sorties"
    sorties.mkdir(exist_ok=True)

    for modele in choisis:
        fichier = sorties / nom_fichier(modele["nom"])
        if fichier.exists():
            resultat = json.loads(fichier.read_text(encoding="utf-8"))
        else:
            resultat = {
                "modele": modele,
                "ollama": version,
                "reglages": REGLAGES,
                "questions_par_passage": QUESTIONS_PAR_PASSAGE,
                "date": datetime.datetime.now().isoformat(timespec="seconds"),
                "appels": [],
            }
        # Reprise : un passage déjà traité sans erreur n'est pas régénéré.
        faits = {a["passage_id"] for a in resultat["appels"] if "erreur" not in a}
        resultat["appels"] = [a for a in resultat["appels"] if "erreur" not in a]

        for passage in cours["passages"]:
            if passage["id"] in faits:
                print(f"  {modele['nom']} · {passage['id']} : déjà fait")
                continue
            print(f"  {modele['nom']} · {passage['id']} : génération…", end="", flush=True)
            appel = generer(modele["nom"], passage)
            resultat["appels"].append(appel)
            fichier.write_text(json.dumps(resultat, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f" {appel['duree_s']} s" + (f" · ERREUR {appel['erreur']}" if "erreur" in appel else ""))
        print()

    print(f"Terminé. Réponses brutes enregistrées dans {sorties}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
