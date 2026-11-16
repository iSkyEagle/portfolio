export interface Step {
  when: string;
  what: string;
  detail: string;
}

export const steps: Step[] = [
  {
    when: "Aujourd'hui",
    what: 'Ingénieur en facteurs humains, Valéo',
    detail: 'région parisienne',
  },
  {
    when: 'Sept. 2025 – août 2026',
    what: 'Alternance en R&D, Valéo Brain',
    detail: 'région parisienne',
  },
  {
    when: '2025 – 2026',
    what: 'Master 2 ESCSI, diplômé',
    detail: 'Université Savoie Mont-Blanc. Ergonomie socio-cognitive des systèmes intelligents.',
  },
  {
    when: 'Mars – mai 2025',
    what: 'Stage de 150 h, Kwark Éducation',
    detail: 'automatisation de workflows avec n8n et I.A générative pour du contenu pédagogique.',
  },
  {
    when: 'Avant',
    what: 'Psychologie',
    detail: 'Université Toulouse II Jean Jaurès.',
  },
];

export const method = [
  {
    title: 'Cadrer',
    text: 'Avant toute ligne de code, un document de spécifications en Markdown fixe le périmètre, la stack et les phases. Les décisions sont validées avant toute grosse modification.',
  },
  {
    title: 'Contraindre',
    text: "Les contraintes viennent en premier : budget à 0 € par mois, données ouvertes, fonctionnement hors ligne, conformité RGPD, fiabilité d'un contenu médical.",
  },
  {
    title: 'Arbitrer',
    text: "Je décide du périmètre et des compromis, par exemple abandonner le CAC 40 pour se concentrer sur le Nasdaq, ou choisir la stack la plus adaptée plutôt que de l'imposer d'emblée.",
  },
];

export const contact = {
  email: 'clement.emery@icloud.com',
  linkedin: { label: 'linkedin.com/in/clément-emery', url: 'https://www.linkedin.com/in/cl%C3%A9ment-emery/' },
  github: { label: 'github.com/iSkyEagle', url: 'https://github.com/iSkyEagle' },
};
