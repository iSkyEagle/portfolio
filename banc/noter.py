#!/usr/bin/env python3
"""Notation humaine des QCM, à l'aveugle, dans le navigateur.

Usage :
    python noter.py

Le script ouvre une page locale (http://127.0.0.1:8765). Les questions de tous
les modèles y sont mélangées et le nom du modèle est masqué, pour que le jugement
ne dépende pas de sa réputation. Chaque note est enregistrée aussitôt dans
notes_humaines.json : on peut s'arrêter et reprendre plus tard.
Seules les questions au format valide sont proposées, les autres ne sont pas lisibles.
"""

from __future__ import annotations

import datetime
import json
import pathlib
import random
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import evaluer

ICI = pathlib.Path(__file__).resolve().parent
NOTES = ICI / "notes_humaines.json"
PORT = 8765
GRAINE_MELANGE = 2026


def questions_a_noter(dossier: pathlib.Path = ICI) -> list[dict]:
    """Questions lisibles, dans un ordre mélangé mais toujours le même, sans le nom du modèle."""
    resultats = evaluer.construire(dossier)
    passages = {p["id"]: p for p in resultats["cours"]["passages"]}
    lisibles = [q for q in resultats["questions"] if q["mesures"]["format_valide"]]
    lisibles.sort(key=lambda q: q["id"])
    random.Random(GRAINE_MELANGE).shuffle(lisibles)
    return [
        {
            "id": q["id"],
            "passage_titre": passages[q["passage_id"]]["titre"],
            "passage": passages[q["passage_id"]]["texte"],
            "question": q["question"],
            "choix": q["choix"],
            "bonne_reponse": q["bonne_reponse"],
        }
        for q in lisibles
    ]


def lire_notes(chemin: pathlib.Path = NOTES) -> dict:
    if chemin.exists():
        return json.loads(chemin.read_text(encoding="utf-8"))
    return {"notes": {}}


def enregistrer_note(note: dict, ids_connus: set[str], chemin: pathlib.Path = NOTES) -> str | None:
    """Valide puis enregistre une note. Renvoie un message d'erreur, ou None si tout va bien."""
    if note.get("id") not in ids_connus:
        return "question inconnue"
    if note.get("verdict") not in evaluer.VERDICTS:
        return "verdict manquant"
    if not isinstance(note.get("juste"), bool) or not isinstance(note.get("unique"), bool):
        return "réponses oui/non manquantes"
    donnees = lire_notes(chemin)
    donnees["notes"][note["id"]] = {
        "juste": note["juste"],
        "unique": note["unique"],
        "verdict": note["verdict"],
        "commentaire": str(note.get("commentaire", "")).strip()[:500],
        "date": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    chemin.write_text(json.dumps(donnees, ensure_ascii=False, indent=2), encoding="utf-8")
    return None


PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notation des QCM</title>
<style>
  body { font: 17px/1.55 system-ui, sans-serif; margin: 0; background: #f0f1ee; color: #1b1f1d; }
  main { max-width: 46rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; } h2 { font-size: 1.15rem; margin: 0 0 .5rem; }
  .avance { color: #5b615d; margin: 0 0 1.25rem; }
  section { background: #fafaf8; border: 1px solid #d3d6d1; padding: 1rem 1.25rem; margin-bottom: 1rem; }
  .passage { font-size: .95rem; color: #3a403c; }
  ol { margin: .5rem 0 0; padding-left: 1.4rem; } li { padding: .15rem 0; }
  li.bonne { font-weight: 700; } li.bonne::after { content: "  ← réponse indiquée par le modèle"; font-weight: 400; color: #1f5f4a; }
  fieldset { border: 0; padding: 0; margin: 0 0 1rem; } legend { font-weight: 700; padding: 0; margin-bottom: .3rem; }
  label { display: inline-flex; align-items: center; gap: .4rem; margin-right: 1.25rem; min-height: 40px; cursor: pointer; }
  textarea { width: 100%; box-sizing: border-box; min-height: 3.5rem; font: inherit; padding: .5rem; }
  button { font: inherit; min-height: 44px; padding: 0 1.1rem; cursor: pointer; border: 1px solid #1b1f1d; background: transparent; }
  button.principal { background: #1f5f4a; border-color: #1f5f4a; color: #fff; }
  .actions { display: flex; gap: .6rem; flex-wrap: wrap; }
  #message { min-height: 1.5rem; font-weight: 700; color: #a3312a; }
</style></head><body><main>
<h1>Notation des QCM à l'aveugle</h1>
<p class="avance" id="avance"></p>
<div id="contenu"></div>
<script>
let questions = [], notes = {}, courant = 0;
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function charger() {
  const etat = await (await fetch('/api/etat')).json();
  questions = etat.questions; notes = etat.notes;
  const premiere = questions.findIndex((q) => !notes[q.id]);
  courant = premiere === -1 ? 0 : premiere;
  afficher();
}

function choixRadio(nom, valeurs, actuel) {
  return valeurs.map(([v, libelle]) =>
    `<label><input type="radio" name="${nom}" value="${v}" ${String(actuel) === v ? 'checked' : ''}> ${libelle}</label>`).join('');
}

function afficher() {
  const faites = questions.filter((q) => notes[q.id]).length;
  $('avance').textContent = `${faites} questions notées sur ${questions.length}` + (faites === questions.length ? ' · terminé, vous pouvez fermer cette page' : '');
  if (!questions.length) { $('contenu').innerHTML = '<p>Aucune question à noter. Lancez d\\'abord generer.py.</p>'; return; }
  const q = questions[courant], n = notes[q.id] || {};
  $('contenu').innerHTML = `
    <section><h2>Passage du cours · ${esc(q.passage_titre)}</h2><p class="passage">${esc(q.passage)}</p></section>
    <section><h2>Question ${courant + 1} sur ${questions.length}</h2><p>${esc(q.question)}</p>
      <ol>${q.choix.map((c, i) => `<li class="${i === q.bonne_reponse ? 'bonne' : ''}">${esc(c)}</li>`).join('')}</ol></section>
    <section><form id="grille">
      <fieldset><legend>La réponse indiquée est-elle juste d'après le passage ?</legend>${choixRadio('juste', [['true', 'Oui'], ['false', 'Non']], n.juste)}</fieldset>
      <fieldset><legend>Est-ce la seule réponse défendable ?</legend>${choixRadio('unique', [['true', 'Oui'], ['false', 'Non']], n.unique)}</fieldset>
      <fieldset><legend>Que feriez-vous de cette question ?</legend>${choixRadio('verdict', [['garder', 'La garder telle quelle'], ['corriger', 'La corriger'], ['jeter', 'La jeter']], n.verdict)}</fieldset>
      <fieldset><legend>Commentaire (facultatif)</legend><textarea name="commentaire" id="commentaire">${esc(n.commentaire || '')}</textarea></fieldset>
      <p id="message" role="alert"></p>
      <div class="actions"><button type="button" id="precedente">← Précédente</button>
        <button type="submit" class="principal">Enregistrer et continuer</button></div>
    </form></section>`;
  $('precedente').disabled = courant === 0;
  $('precedente').onclick = () => { courant -= 1; afficher(); };
  $('grille').onsubmit = enregistrer;
  window.scrollTo(0, 0);
}

async function enregistrer(e) {
  e.preventDefault();
  const f = new FormData(e.target), q = questions[courant];
  if (!f.get('juste') || !f.get('unique') || !f.get('verdict')) { $('message').textContent = 'Répondez aux trois questions de la grille.'; return; }
  const note = { id: q.id, juste: f.get('juste') === 'true', unique: f.get('unique') === 'true', verdict: f.get('verdict'), commentaire: f.get('commentaire') };
  const reponse = await fetch('/api/note', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(note) });
  if (!reponse.ok) { $('message').textContent = 'Enregistrement impossible : ' + (await reponse.text()); return; }
  notes[q.id] = note;
  const suivante = questions.findIndex((x, i) => i > courant && !notes[x.id]);
  courant = suivante !== -1 ? suivante : Math.min(courant + 1, questions.length - 1);
  afficher();
}
charger();
</script></main></body></html>"""


def serveur(questions: list[dict], chemin_notes: pathlib.Path = NOTES, port: int = PORT) -> HTTPServer:
    ids = {q["id"] for q in questions}

    class Gestionnaire(BaseHTTPRequestHandler):
        def log_message(self, *args):  # terminal silencieux
            pass

        def repondre(self, code: int, corps: bytes, type_mime: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", type_mime + "; charset=utf-8")
            self.send_header("Content-Length", str(len(corps)))
            self.end_headers()
            self.wfile.write(corps)

        def do_GET(self):
            if self.path == "/":
                self.repondre(200, PAGE.encode("utf-8"), "text/html")
            elif self.path == "/api/etat":
                etat = {"questions": questions, "notes": lire_notes(chemin_notes)["notes"]}
                self.repondre(200, json.dumps(etat, ensure_ascii=False).encode("utf-8"), "application/json")
            else:
                self.repondre(404, b"introuvable", "text/plain")

        def do_POST(self):
            if self.path != "/api/note":
                return self.repondre(404, b"introuvable", "text/plain")
            try:
                note = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self.repondre(400, "requête illisible".encode("utf-8"), "text/plain")
            erreur = enregistrer_note(note, ids, chemin_notes)
            if erreur:
                return self.repondre(400, erreur.encode("utf-8"), "text/plain")
            self.repondre(200, b"{}", "application/json")

    # Écoute sur la machine locale uniquement.
    return HTTPServer(("127.0.0.1", port), Gestionnaire)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not (ICI / "sorties").exists():
        print("Aucune sortie à noter : lancez d'abord generer.py.")
        return 1
    questions = questions_a_noter()
    adresse = f"http://127.0.0.1:{PORT}"
    print(f"{len(questions)} questions à noter. Page ouverte sur {adresse}")
    print("Fermez cette fenêtre (ou Ctrl+C) quand vous avez terminé.")
    webbrowser.open(adresse)
    try:
        serveur(questions).serve_forever()
    except KeyboardInterrupt:
        print("\nNotation arrêtée. Les notes sont dans notes_humaines.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
