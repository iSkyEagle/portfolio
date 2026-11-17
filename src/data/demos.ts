import type { SkillId } from './skills';

export type DemoState = 'disponible' | 'preparation';
// Une démo « en préparation » est annoncée mais ne s'ouvre pas encore : elle n'a pas de route.

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
  /** Adresse de la démo, quand elle est disponible. */
  route?: string;
}

export const demos: Demo[] = [
  {
    id: 'banc',
    title: "Banc d'évaluation de QCM générés",
    state: 'disponible',
    route: '/demos/banc',
    action:
      'Vous notez quelques questions générées par des modèles exécutés en local, puis vous comparez votre jugement aux mesures automatiques.',
    shows: "Une évaluation d'I.A qui croise des métriques automatiques et un protocole d'évaluation humaine.",
    note: 'Sorties réelles de modèles, enregistrées à l\'avance.',
    skills: ['evaluation', 'modeles'],
  },
  {
    id: 'reservation',
    title: 'Outil interne de réservation',
    state: 'disponible',
    route: '/demos/reservation',
    action: 'Vous réservez un véhicule, puis vous passez côté responsable pour valider la demande.',
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
    note: 'En cours de reprise avec des modèles plus récents.',
    skills: ['modeles', 'evaluation'],
  },
];

/** Les démos disponibles d'abord. */
export const orderedDemos: Demo[] = [...demos].sort(
  (a, b) => Number(b.state === 'disponible') - Number(a.state === 'disponible'),
);

export function getDemo(id: string): Demo | undefined {
  return demos.find((d) => d.id === id);
}
