import type { BenchResults, ControlId, Question } from './logic';

/**
 * Résultats écrits à la main, réservés aux tests. Ils ne viennent d'aucun modèle
 * et ne sont jamais affichés sur le site.
 */
const all = (value: boolean): Record<ControlId, boolean> => ({
  format_valide: true,
  citation_fidele: value,
  reponse_appuyee: value,
  sans_indice_longueur: true,
  sans_doublon: true,
});

function q(id: string, modele: string, passage: string, ok: boolean): Question {
  return {
    id,
    modele,
    passage_id: passage,
    question: `Énoncé ${id} ?`,
    choix: ['Un', 'Deux', 'Trois', 'Quatre'],
    bonne_reponse: 1,
    citation: `citation ${id}`,
    mesures: all(ok),
    tous_controles: ok,
  };
}

const summary = (nom: string, ok: number, garder: number) => ({
  nom,
  parametres: '7B',
  appels: 2,
  appels_lisibles: 2,
  echecs: [],
  questions_attendues: 4,
  questions_obtenues: 3,
  controles: { format_valide: 3, citation_fidele: ok, reponse_appuyee: ok, sans_indice_longueur: 3, sans_doublon: 3 },
  tous_controles: ok,
  positions_bonne_reponse: [0, 3, 0, 0],
  duree_moyenne_s: 40,
  jetons_par_seconde: 7.5,
  notes_humaines: { questions_notees: 3, garder, corriger: 3 - garder, jeter: 0, reponse_juste: 3, reponse_unique: 2 },
});

export const fixture: BenchResults = {
  genere_le: '2026-01-01T00:00:00',
  cours: {
    titre: 'Cours de test',
    passages: [
      { id: 'p1', titre: 'Premier passage', texte: 'Texte du premier passage.' },
      { id: 'p2', titre: 'Second passage', texte: 'Texte du second passage.' },
    ],
  },
  controles: {
    format_valide: 'Format valide',
    citation_fidele: 'Citation fidèle',
    reponse_appuyee: 'Réponse appuyée',
    sans_indice_longueur: 'Sans indice de longueur',
    sans_doublon: 'Sans doublon',
  },
  modeles: [summary('alpha:latest', 2, 1), summary('beta:latest', 1, 2)],
  questions: [
    q('a1', 'alpha:latest', 'p1', true),
    q('a2', 'alpha:latest', 'p2', true),
    q('a3', 'alpha:latest', 'p2', false),
    q('b1', 'beta:latest', 'p1', true),
    q('b2', 'beta:latest', 'p1', false),
    q('b3', 'beta:latest', 'p2', false),
  ],
  notes: {
    a1: { juste: true, unique: true, verdict: 'garder' },
    a2: { juste: true, unique: false, verdict: 'corriger', commentaire: 'Deux réponses possibles.' },
    a3: { juste: false, unique: true, verdict: 'jeter' },
    b1: { juste: true, unique: true, verdict: 'garder' },
    b2: { juste: true, unique: true, verdict: 'garder' },
    b3: { juste: true, unique: true, verdict: 'corriger' },
  },
  comparaison: {
    auto_ok_humain_garder: 2,
    auto_ok_humain_rejet: 1,
    auto_ko_humain_garder: 1,
    auto_ko_humain_rejet: 2,
    questions_notees: 6,
    accord: 0.67,
  },
};
