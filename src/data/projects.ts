import type { SkillId } from './skills';

export type Status = 'usage' | 'termine' | 'cours';

export const statusLabel: Record<Status, string> = {
  usage: 'En usage',
  termine: 'Terminé',
  cours: 'En cours',
};

export interface Project {
  id: string;
  group: 'projets' | 'scolaires';
  title: string;
  status: Status;
  category: string;
  summary: string;
  tags: string[];
  details: { term: string; text: string }[];
  skills: SkillId[];
  /** Fiche affichée sur toute la largeur. */
  wide?: boolean;
}

export const projects: Project[] = [
  {
    id: 'metadata-v',
    group: 'projets',
    title: 'MetaData V',
    status: 'usage',
    category: 'Recherche terrain · Application de bureau',
    summary:
      "Un outil de collecte de données de participants pour des études de conduite : les expérimentateurs saisissent hors ligne sur tablette Windows, et un tableau de bord suit l'avancement par rapport aux quotas de recrutement.",
    tags: ['Electron', 'React', 'Vite', 'Tailwind', 'Zustand', 'Python'],
    details: [
      {
        term: 'Construit',
        text: 'Une application de bureau (interface en français, anglais et tchèque), un tableau de bord de quotas et un explorateur interactif des données : distributions par champ, croisements libres, comparaison de deux sous-groupes, table filtrable exportable en CSV.',
      },
      {
        term: 'Architecture',
        text: 'Pilotée par des fichiers de configuration JSON : un collègue crée une nouvelle collecte depuis un créateur intégré, sans recompiler. Les rapports sont des pages HTML autonomes, sans serveur.',
      },
      {
        term: 'Évolution',
        text: 'Prototype Python/PyQt5 abandonné, puis application Electron. Un document de reprise (architecture, plan des fichiers, procédure de packaging) a été rédigé pour passer la main à un collaborateur.',
      },
    ],
    skills: ['dev', 'fh'],
    wide: true,
  },
  {
    id: 'analyse-actions',
    group: 'projets',
    title: "Pipeline d'analyse d'actions",
    status: 'termine',
    category: 'Finance · Données ouvertes',
    summary:
      'Un pipeline qui ingère les comptes publics des sociétés cotées aux États-Unis pour les évaluer sur quatre axes : valorisation, qualité, croissance et dilution.',
    tags: ['Python', 'SEC EDGAR', 'Supabase', 'yfinance'],
    details: [
      {
        term: 'Construit',
        text: "Un moteur de mapping XBRL qui sépare la configuration des tags de la logique d'extraction, et un schéma SQL (cours, comptes, métriques). Validé d'abord sur 44 sociétés, puis dimensionné pour environ 4 500 tickers, soit environ 290 Mo pour une limite de 500 Mo.",
      },
      {
        term: 'Règles',
        text: "Le 4e trimestre est toujours recalculé (exercice moins 9 mois). Les dépôts sont classés par couverture des champs plutôt que par date, ce qui a fait passer la cohérence d'environ 54 % à 91 %. Aucune dette n'est déduite de l'absence d'un tag.",
      },
      {
        term: 'Contraintes',
        text: '0 € par mois : SEC EDGAR, yfinance pour les cours seulement, Supabase en offre gratuite (500 Mo).',
      },
    ],
    skills: ['dev'],
    wide: true,
  },
  {
    id: 'outil-pvt',
    group: 'projets',
    title: 'Outil PVT',
    status: 'termine',
    category: 'Recherche · Outil de mesure',
    summary:
      'Une implémentation fidèle du NASA-PVT sur écran tactile (Arsintescu et al., 2019), pour mesurer la vigilance avec les mêmes définitions et les mêmes métriques que la littérature.',
    tags: ['NASA-PVT', 'Ergonomie cognitive', 'JavaScript'],
    details: [
      {
        term: 'Protocole',
        text: 'Trois durées (3, 5 et 10 min), intervalles inter-stimulus aléatoires uniformes (2 à 10 s en version longue, 1 à 4 s en versions courtes), retour du temps de réaction pendant 1 s et stimulus en compteur de millisecondes, comme sur le PVT-192.',
      },
      {
        term: 'Définitions',
        text: "Réponse valide entre 100 ms et 10 s. Faux départ sous 100 ms ou clic pendant l'intervalle. Lapse à partir de 500 ms, lapse mineur à partir de 355 ms, omission à 10 s.",
      },
      {
        term: 'Métriques',
        text: 'Temps de réaction moyen et médian, vitesse de réponse réciproque (1000/TR, omissions pénalisées à 10 s), moyenne des 10 % de réponses les plus lentes et les plus rapides, taux de lapses, de faux départs et d\'omissions.',
      },
      {
        term: 'Terrain',
        text: 'Utilisable sur une tablette sans réseau, installée par copie de dossier. Réglage de luminosité pour les passations de nuit. Export CSV et JSON, essai par essai et en résumé.',
      },
    ],
    skills: ['evaluation', 'fh'],
  },
  {
    id: 'plateforme-revision',
    group: 'projets',
    title: 'Plateforme de révision',
    status: 'cours',
    category: 'Éducation · I.A générative',
    summary:
      "Une application de révision pour un proche en études d'infirmière : on dépose ses cours en PDF, l'I.A les synthétise par chapitre et génère flashcards et QCM.",
    tags: ['PWA', 'Supabase', 'Vercel', 'API Gemini'],
    details: [
      {
        term: 'Construit',
        text: 'Spécifications complètes et document de démarrage pour lancer le développement. Suivi de progression détaillé par chapitre prévu.',
      },
      {
        term: 'Choix clé',
        text: "Les questions sont générées uniquement à partir du cours déposé, jamais des connaissances générales du modèle, pour garantir la fiabilité d'un contenu médical.",
      },
    ],
    skills: ['modeles'],
  },
  {
    id: 'fittrack',
    group: 'projets',
    title: 'FitTrack',
    status: 'cours',
    category: 'Santé · Application mobile',
    summary: 'Une application de suivi sportif et nutritionnel en PWA, déployée sur Vercel.',
    tags: ['PWA', 'Vercel', 'USDA FoodData Central'],
    details: [
      {
        term: 'Construit',
        text: "Suivi des séances personnalisées, de la nutrition, de l'hydratation et de la composition corporelle. Un module de macronutriments est en cours : recherche d'un ingrédient, saisie en grammes, calcul automatique, repas composés et enregistrés.",
      },
      {
        term: 'Choix',
        text: "Une base d'ingrédients ouverte (USDA FoodData Central ou Open Food Facts) plutôt qu'une reconnaissance de photos : l'estimation par image restait trop imprécise, et le budget reste à 0 €.",
      },
      { term: 'Suite', text: "Conversion en application native à l'étude." },
    ],
    skills: ['dev'],
  },
  {
    id: 'workflow-documents',
    group: 'projets',
    title: 'Workflow de documents',
    status: 'termine',
    category: 'Automatisation',
    summary:
      'Un workflow n8n qui traite un document long en plusieurs parties avec un agent I.A, puis génère une présentation PowerPoint.',
    tags: ['n8n', 'Python', 'I.A générative'],
    details: [
      {
        term: 'Construit',
        text: "Un agent qui garde la mémoire d'une étape à l'autre, et un script Python de génération de PPTX qui reprend les macros VBA d'un gabarit PowerPoint.",
      },
    ],
    skills: ['agents'],
  },
  {
    id: 'simulation-payne',
    group: 'scolaires',
    title: 'Simulation de décision selon Payne (1976)',
    status: 'termine',
    category: 'Master 2 · Modélisation cognitive',
    summary:
      "Un modèle qui simule le choix d'un appartement par deux profils cognitifs distincts, pour montrer que le comportement vient de mécanismes cognitifs plausibles et non d'un simple calcul.",
    tags: ['Python', 'PyTorch', 'YAML'],
    details: [
      {
        term: 'Profils',
        text: 'Un étudiant novice, à mémoire de travail limitée et à critère éliminatoire unique (le bruit), et un professionnel expert, à capacité plus élevée et deux critères éliminatoires.',
      },
      {
        term: 'Construit',
        text: "Un pipeline cognitif déterministe, puis un réseau LSTM écrit de zéro en PyTorch et entraîné sur ses trajectoires, plutôt qu'un LLM affiné. Le choix du LSTM s'appuie sur sa correspondance avec le contrôle de la mémoire de travail (Miyake et Friedman, 2012).",
      },
      {
        term: 'Rigueur',
        text: "Un score de 100 % a déclenché un audit plutôt que de la satisfaction : il a révélé une fuite d'information, ensuite corrigée. Trois expériences de validation ont suivi : sondage de la valence, échange de profils et simulation en boucle fermée.",
      },
      {
        term: 'Livrables',
        text: "Un dossier d'environ dix pages, des schémas d'architecture, un guide pour le jury et une démonstration en direct en préparation.",
      },
      {
        term: 'Équipe',
        text: "Réalisé en binôme : la partie théorique par mon camarade, l'implémentation technique par moi.",
      },
    ],
    skills: ['modeles', 'evaluation'],
    wide: true,
  },
  {
    id: 'intelligence-collective',
    group: 'scolaires',
    title: "Modélisation de l'intelligence collective",
    status: 'termine',
    category: 'Master 2 · Intelligence collective',
    summary:
      "Un exposé oral de 20 minutes, en binôme, qui défend le modèle computationnel de Kaufmann, Gupta et Taylor (2021) en s'appuyant sur deux autres articles.",
    tags: ['Intelligence collective', 'Modélisation computationnelle'],
    details: [
      {
        term: 'Structure',
        text: 'Trois parties : la fondation empirique (Woolley et al., 2010), le pont cognitif (Woolley et Gupta, 2023), puis le modèle computationnel, qui occupe environ les deux tiers du contenu.',
      },
      {
        term: 'Idée clé',
        text: "Une diapositive relie les mécanismes du cadre TSM-CI aux paramètres α (théorie de l'esprit) et γ (alignement du groupe) du modèle.",
      },
      { term: 'Livrables', text: '19 diapositives et un discours rédigé.' },
    ],
    skills: ['fh'],
  },
  {
    id: 'formation-ia',
    group: 'scolaires',
    title: "L'I.A générative au quotidien",
    status: 'termine',
    category: 'Formation · Pédagogie',
    summary:
      "Une formation à l'I.A générative pour des étudiants et du personnel administratif et enseignant de l'Université Savoie Mont-Blanc, sans prérequis techniques. Animée en binôme.",
    tags: ['Qualtrics', 'Word', 'PowerPoint'],
    details: [
      {
        term: 'Construit',
        text: "Cinq parties, avec des exemples tirés du quotidien de l'université : courriels d'étudiants, annonces Erasmus, comptes rendus de réunion. Un support de 16 diapositives.",
      },
      {
        term: 'Évaluation',
        text: "Un questionnaire de satisfaction exporté vers Qualtrics et un rapport de formation fondé sur l'andragogie de Knowles, le modèle 70-20-10 et l'approche constructiviste.",
      },
    ],
    skills: ['fh'],
  },
  {
    id: 'court-metrage',
    group: 'scolaires',
    title: 'Et puis me***',
    status: 'termine',
    category: "Création · Regard critique sur l'I.A",
    summary:
      "Un court-métrage d'une minute sur la délégation de ses décisions à l'I.A, avec une contrainte de départ : mêler contenu généré et contribution humaine.",
    tags: ["Génération d'images", 'Animation vidéo', 'CapCut'],
    details: [
      {
        term: 'Concept',
        text: "Un écran partagé oppose deux versions du même personnage : l'une confie ses décisions quotidiennes à une I.A, en images générées à l'esthétique bleue et froide ; l'autre vit avec ses imperfections, en images réelles. Le film s'arrête sur un fondu au noir avant la réponse de l'I.A.",
      },
      { term: 'Dossier', text: "Un dossier écrit qui s'appuie sur Stiegler, Turkle, Nevejans, Hazan et Sibony." },
    ],
    skills: ['fh'],
  },
  {
    id: 'assistant-medical',
    group: 'scolaires',
    title: "Assistant d'orientation médicale",
    status: 'termine',
    category: 'Santé · I.A responsable',
    summary:
      'Un chatbot qui oriente sans diagnostiquer et rappelle quand consulter en urgence. Il montre à la fois des compétences de développement et une I.A responsable en santé.',
    tags: ['Node.js', 'Express', 'API Gemini', 'JavaScript'],
    details: [
      {
        term: 'Construit',
        text: "Un backend Node.js relié à l'API Gemini et une interface en HTML, CSS et JavaScript pur. Le prompt système impose un ton empathique, l'absence de diagnostic et l'orientation vers les urgences.",
      },
      {
        term: 'Choix',
        text: "Gemini plutôt qu'une API payante, pour le coût.",
      },
    ],
    skills: ['modeles', 'dev'],
  },
];

export interface Row {
  title: string;
  text: string;
  tags: string[];
}

export const academicRows: Row[] = [
  {
    title: 'Mémoire de Master 2',
    text: "Réplication d'une expérience sur la demande cognitive d'une tâche secondaire en conduite (paradigme BT + DRT, d'après Trommler et al., 2025). L'objectif est d'évaluer la demande cognitive des interfaces du véhicule comme complément préventif aux systèmes de surveillance du conducteur, qui réagissent après coup.",
    tags: ['Protocole expérimental', 'Ergonomie cognitive'],
  },
  {
    title: 'Sociologie des usages',
    text: "Dossier de 20 à 25 pages sur un système de surveillance du conducteur, construit avec la théorie de l'acteur-réseau (Latour).",
    tags: ["Théorie de l'acteur-réseau"],
  },
  {
    title: 'Conformité juridique',
    text: "Dossier en sept sections sur un système d'accès au véhicule par reconnaissance faciale : RGPD, règlement européen sur l'I.A, Cyber Resilience Act, ePrivacy et règlement UN R155.",
    tags: ['RGPD', 'AI Act', 'UN R155'],
  },
  {
    title: "Essai d'ethnométhodologie",
    text: "Essai académique qui analyse mes missions en entreprise à travers l'ethnométhodologie.",
    tags: ['Ethnométhodologie'],
  },
];

export const otherRows: Row[] = [
  {
    title: "Suivi d'investissements",
    text: 'Application personnelle de suivi, installable sur mobile, avec une base de données hébergée.',
    tags: ['PWA', 'Supabase', 'Vercel'],
  },
  {
    title: 'Outil interne de réservation',
    text: "Application de réservation d'une flotte de véhicules partagés, reliée à Google Calendar, utilisée au quotidien par une équipe.",
    tags: ['Apps Script', 'Google Calendar', 'Google Sheets'],
  },
  {
    title: 'Mesures spectrales',
    text: 'Traitement de mesures de transmission spectrale entre 380 et 1000 nm, avec un script qui génère automatiquement un graphique par échantillon.',
    tags: ['Google Sheets', 'Apps Script'],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function filterProjects(list: Project[], skill: SkillId | null): Project[] {
  return skill ? list.filter((p) => p.skills.includes(skill)) : list;
}
