export type SkillId = 'agents' | 'modeles' | 'evaluation' | 'dev' | 'fh';

export interface Proof {
  /** Titre affiché de la preuve. */
  label: string;
  /** Ce que cette réalisation démontre pour la compétence. */
  claim: string;
  /** Lien interne (route) ou externe (URL complète). */
  to: string;
}

export interface Skill {
  id: SkillId;
  title: string;
  short: string;
  description: string;
  tools: string[];
  proofs: Proof[];
  /** Démonstration associée, voir data/demos.ts. */
  demoId?: string;
}

export const skills: Skill[] = [
  {
    id: 'agents',
    title: 'Agents et automatisation',
    short: 'Des workflows où un agent I.A traite un travail en plusieurs étapes.',
    description:
      "Je conçois des workflows dans lesquels un agent I.A enchaîne plusieurs étapes sans perdre le fil, jusqu'à un livrable utilisable.",
    tools: ['n8n', 'Python', 'I.A générative'],
    proofs: [
      {
        label: 'Workflow de documents',
        claim:
          "Un agent garde la mémoire d'une étape à l'autre pour traiter un document long, puis un script Python génère la présentation PowerPoint.",
        to: '/projets/workflow-documents',
      },
      {
        label: 'Stage chez Kwark Éducation',
        claim: '150 heures à automatiser des workflows de contenu pédagogique avec n8n et de l\'I.A générative.',
        to: '/parcours',
      },
    ],
  },
  {
    id: 'modeles',
    title: 'Modèles et LLM en local',
    short: 'Un modèle exécuté sur ma machine, contraint à ce qu\'on lui fournit.',
    description:
      "J'entraîne des modèles avec PyTorch et j'exécute des LLM en local. Je cadre ce qu'un modèle a le droit de répondre quand une erreur coûte cher.",
    tools: ['PyTorch', 'Mistral', 'Ollama', 'API Gemini'],
    proofs: [
      {
        label: "Banc d'évaluation",
        claim:
          'Mistral et Qwen 2.5 exécutés en local avec Ollama, avec la même consigne et les mêmes réglages, sur 24 questions générées à partir d\'un cours.',
        to: '/demos/banc',
      },
      {
        label: "Assistant d'orientation médicale",
        claim: "Un prompt système qui interdit le diagnostic et oriente vers les urgences, avec l'API Gemini.",
        to: '/projets/assistant-medical',
      },
      {
        label: 'Plateforme de révision',
        claim: 'Les questions sont générées uniquement à partir du cours déposé, jamais des connaissances générales du modèle.',
        to: '/projets/plateforme-revision',
      },
      {
        label: 'Simulation de décision selon Payne',
        claim: 'Un réseau LSTM écrit de zéro en PyTorch et entraîné sur les trajectoires d\'un pipeline cognitif.',
        to: '/projets/simulation-payne',
      },
    ],
    demoId: 'banc',
  },
  {
    id: 'evaluation',
    title: "Évaluation de systèmes d'I.A",
    short: 'Des mesures définies à l\'avance et des résultats audités.',
    description:
      "Je vérifie ce qu'un système fait réellement avant de le croire : métriques définies à l'avance, protocole expérimental, audit des résultats trop beaux.",
    tools: ['Protocole expérimental', 'Métriques', 'Python'],
    proofs: [
      {
        label: "Banc d'évaluation",
        claim:
          "Cinq contrôles automatiques et une notation humaine à l'aveugle, croisés : ils ne concordent que sur 62 % des questions.",
        to: '/demos/banc',
      },
      {
        label: 'Simulation de décision selon Payne',
        claim:
          "Un score de 100 % a déclenché un audit, qui a révélé une fuite d'information. Trois expériences de validation ont suivi la correction.",
        to: '/projets/simulation-payne',
      },
      {
        label: 'Outil PVT',
        claim: 'Les définitions et les métriques sont celles de la littérature, pour que les mesures soient comparables.',
        to: '/projets/outil-pvt',
      },
      {
        label: 'Mémoire de Master 2',
        claim: "Réplication d'une expérience sur la demande cognitive d'une tâche secondaire en conduite.",
        to: '/projets#alternance',
      },
    ],
    demoId: 'banc',
  },
  {
    id: 'dev',
    title: 'Développement web et logiciel',
    short: 'Des applications livrées, du schéma de données au déploiement.',
    description:
      "Je livre des applications complètes : interface, données, tests et mise en ligne. Les contraintes de budget et de terrain sont fixées avant le code.",
    tools: ['React', 'TypeScript', 'Python', 'SQL', 'Electron', 'Supabase', 'Vitest'],
    proofs: [
      {
        label: 'MetaData V',
        claim: 'Une application de bureau Electron et React, pilotée par des fichiers de configuration, en usage sur le terrain.',
        to: '/projets/metadata-v',
      },
      {
        label: "Pipeline d'analyse d'actions",
        claim: 'Un pipeline Python et un schéma SQL dimensionnés pour environ 4 500 sociétés, à 0 € par mois.',
        to: '/projets/analyse-actions',
      },
      {
        label: 'Ce site',
        claim: 'React et TypeScript, tests automatisés et déploiement continu. Le code est public.',
        to: 'https://github.com/iSkyEagle/portfolio',
      },
    ],
    demoId: 'reservation',
  },
  {
    id: 'fh',
    title: 'Facteurs humains et IHM',
    short: 'Partir de l\'usage réel et mesurer ce que le système change.',
    description:
      "Ma formation d'ergonome cognitif guide ce que je construis : je pars de l'usage réel et je mesure ce qu'un système change pour ses utilisateurs.",
    tools: ['Ergonomie cognitive', 'Critères de Bastien et Scapin', 'Protocole expérimental'],
    proofs: [
      {
        label: 'Mémoire de Master 2',
        claim: "Évaluer la demande cognitive des interfaces du véhicule, en complément des systèmes de surveillance du conducteur.",
        to: '/projets#alternance',
      },
      {
        label: 'MetaData V',
        claim: 'Conçu pour les expérimentateurs : saisie hors ligne sur tablette, interface en trois langues, reprise documentée.',
        to: '/projets/metadata-v',
      },
      {
        label: 'Dossier de conformité juridique',
        claim: "Un système d'accès par reconnaissance faciale lu à travers le RGPD et le règlement européen sur l'I.A.",
        to: '/projets#alternance',
      },
    ],
  },
];

export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}
