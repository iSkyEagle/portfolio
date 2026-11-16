/**
 * Lecture des résultats du banc d'évaluation (banc/resultats.json, écrit par banc/evaluer.py)
 * et petits calculs pour la démonstration. Aucun chiffre n'est saisi à la main dans le site.
 */

export type Verdict = 'garder' | 'corriger' | 'jeter';
export type ControlId = 'format_valide' | 'citation_fidele' | 'reponse_appuyee' | 'sans_indice_longueur' | 'sans_doublon';

export interface Question {
  id: string;
  modele: string;
  passage_id: string;
  question: string;
  choix: string[];
  bonne_reponse: number | null;
  citation: string;
  mesures: Record<ControlId, boolean>;
  tous_controles: boolean;
}

export interface HumanNote {
  juste: boolean;
  unique: boolean;
  verdict: Verdict;
  commentaire?: string;
}

export interface ModelSummary {
  nom: string;
  parametres?: string;
  quantification?: string;
  taille_go?: number;
  appels: number;
  appels_lisibles: number;
  echecs: { passage_id: string; raison: string }[];
  questions_attendues: number;
  questions_obtenues: number;
  controles: Record<ControlId, number>;
  tous_controles: number;
  positions_bonne_reponse: number[];
  duree_moyenne_s: number | null;
  jetons_par_seconde: number | null;
  notes_humaines: { questions_notees: number; garder: number; corriger: number; jeter: number; reponse_juste: number; reponse_unique: number };
}

export interface Comparison {
  auto_ok_humain_garder: number;
  auto_ok_humain_rejet: number;
  auto_ko_humain_garder: number;
  auto_ko_humain_rejet: number;
  questions_notees: number;
  accord: number | null;
}

export interface BenchResults {
  genere_le: string | null;
  cours: { titre: string; passages: { id: string; titre: string; texte: string }[] };
  controles: Record<ControlId, string>;
  modeles: ModelSummary[];
  questions: Question[];
  notes: Record<string, HumanNote>;
  comparaison: Comparison;
}

export const verdictLabel: Record<Verdict, string> = {
  garder: 'La garder',
  corriger: 'La corriger',
  jeter: 'La jeter',
};

/** Libellés courts des contrôles, pour les tableaux. */
export const controlShort: Record<ControlId, string> = {
  format_valide: 'Format valide',
  citation_fidele: 'Citation mot pour mot',
  reponse_appuyee: 'Réponse dans la citation',
  sans_indice_longueur: "Pas d'indice de longueur",
  sans_doublon: 'Pas de doublon',
};

export const controlIds = Object.keys(controlShort) as ControlId[];

/** Nom d'affichage d'un modèle : « mistral:latest » devient « mistral ». */
export function modelName(nom: string): string {
  return nom.replace(/:latest$/, '');
}

export function hasData(r: BenchResults): boolean {
  return r.questions.some((q) => q.mesures.format_valide);
}

export function hasNotes(r: BenchResults): boolean {
  return r.comparaison.questions_notees > 0;
}

type Bucket = 'auto_ok_humain_rejet' | 'auto_ko_humain_garder' | 'auto_ko_humain_rejet' | 'auto_ok_humain_garder' | 'non_notee';

function bucketOf(q: Question, note: HumanNote | undefined): Bucket {
  if (!note) return 'non_notee';
  const auto = q.tous_controles ? 'auto_ok' : 'auto_ko';
  return `${auto}_humain_${note.verdict === 'garder' ? 'garder' : 'rejet'}` as Bucket;
}

/**
 * Choisit les questions proposées au visiteur. Le choix est toujours le même pour des résultats donnés.
 * On sert d'abord les cas où le jugement humain et les contrôles automatiques se contredisent,
 * puis on complète, en variant les modèles et les passages.
 */
export function pickSample(r: BenchResults, size: number): Question[] {
  const order: Bucket[] = ['auto_ok_humain_rejet', 'auto_ko_humain_garder', 'auto_ko_humain_rejet', 'auto_ok_humain_garder', 'non_notee'];
  const pool = r.questions.filter((q) => q.mesures.format_valide).sort((a, b) => a.id.localeCompare(b.id));
  const picked: Question[] = [];
  const count = (key: 'modele' | 'passage_id', value: string) => picked.filter((p) => p[key] === value).length;

  while (picked.length < size && picked.length < pool.length) {
    const before = picked.length;
    for (const bucket of order) {
      if (picked.length >= size) break;
      const candidates = pool.filter((q) => !picked.includes(q) && bucketOf(q, r.notes[q.id]) === bucket);
      if (candidates.length === 0) continue;
      // Le candidat dont le modèle et le passage sont les moins représentés jusqu'ici.
      candidates.sort(
        (a, b) =>
          count('modele', a.modele) + count('passage_id', a.passage_id) - (count('modele', b.modele) + count('passage_id', b.passage_id)),
      );
      picked.push(candidates[0]);
    }
    if (picked.length === before) break;
  }
  return picked;
}

export interface Agreement {
  judged: number;
  withHuman: number | null;
  withChecks: number;
}

/** Accord du visiteur avec la notation humaine et avec les contrôles automatiques. */
export function agreement(r: BenchResults, verdicts: Record<string, Verdict>): Agreement {
  const ids = Object.keys(verdicts).filter((id) => r.questions.some((q) => q.id === id));
  const noted = ids.filter((id) => r.notes[id]);
  const keep = (v: Verdict) => v === 'garder';
  return {
    judged: ids.length,
    withHuman: noted.length ? noted.filter((id) => r.notes[id].verdict === verdicts[id]).length : null,
    withChecks: ids.filter((id) => keep(verdicts[id]) === r.questions.find((q) => q.id === id)!.tous_controles).length,
  };
}

export function percent(part: number, total: number): string {
  return total > 0 ? `${Math.round((100 * part) / total)} %` : '–';
}
