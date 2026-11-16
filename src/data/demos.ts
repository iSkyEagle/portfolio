import type { SkillId } from './skills';

export type DemoState = 'disponible' | 'preparation';

export interface Demo {
  id: string;
  title: string;
  state: DemoState;
  /** Ce que fait le visiteur. */
  action: string;
  /** Ce que la démonstration prouve. */
  shows: string;
  /** Nature des données, dite sans détour. */
  note: string;
  skills: SkillId[];
}

export const demos: Demo[] = [
  {
    id: 'banc',
    title: "Banc d'évaluation de QCM générés",
    state: 'preparation',
    action:
      'Vous notez quelques questions générées par des modèles exécutés en local, puis vous comparez votre jugement aux mesures automatiques.',
    shows: "Une évaluation d'I.A qui croise des métriques automatiques et un protocole d'évaluation humaine.",
    note: 'Sorties réelles de modèles, enregistrées à l\'avance.',
    skills: ['evaluation', 'modeles'],
  },
  {
    id: 'reservation',
    title: 'Outil interne de réservation',
    state: 'preparation',
    action: 'Vous réservez un véhicule, puis vous passez côté administrateur pour valider la demande.',
    shows: "Le parcours complet d'un outil utilisé au quotidien par une équipe.",
    note: 'Reproduction autonome, avec des véhicules et des réservations fictifs.',
    skills: ['dev', 'fh'],
  },
  {
    id: 'revision',
    title: 'Plateforme de révision',
    state: 'preparation',
    action: "Vous ouvrez un cours d'exemple et vous voyez chaque question reliée au passage dont elle vient.",
    shows: 'Un modèle contraint à sa source, quand la fiabilité du contenu compte.',
    note: 'Questions générées à l\'avance à partir d\'un texte libre de droits.',
    skills: ['modeles', 'evaluation'],
  },
  {
    id: 'workflow',
    title: "Workflow d'agents",
    state: 'preparation',
    action: "Vous rejouez le traitement d'un document étape par étape et vous voyez ce que l'agent garde en mémoire.",
    shows: "Un agent qui conserve son contexte d'une étape à l'autre.",
    note: "Rejeu d'une exécution enregistrée.",
    skills: ['agents'],
  },
];

export function getDemo(id: string): Demo | undefined {
  return demos.find((d) => d.id === id);
}
