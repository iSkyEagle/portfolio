# Portfolio de Clément Emery

Site en ligne : https://iskyeagle.github.io/portfolio/

Un site en cinq rubriques : accueil, compétences reliées à leurs preuves, démonstrations, fiches de projet, parcours et contact.

## Stack

- React et TypeScript, construits avec Vite
- React Router, en routage par ancre (`#/page`) pour fonctionner sur GitHub Pages sans configuration serveur
- Vitest et Testing Library pour les tests
- GitHub Actions : types, tests et build à chaque envoi, mise en ligne depuis `main`

## Organisation

```
src/
  data/        contenu du site (compétences, fiches, démos, parcours)
  components/  mise en page, fiche de projet, contact
  pages/       une page par rubrique
  hooks/       thème clair ou sombre, titre de l'onglet
```

Le contenu est séparé de l'affichage : ajouter une fiche ou une preuve revient à modifier un fichier de `src/data/`.
Un test vérifie qu'aucune preuve ne pointe vers une fiche qui n'existe pas.

## Commandes

```
npm install      installer les dépendances
npm run dev      lancer le site en local
npm test         lancer les tests
npm run build    vérifier les types et construire le site dans dist/
```

## Choix de conception

- Chaque compétence affichée renvoie à des réalisations précises.
- Les démonstrations disent d'où viennent leurs données.
- L'interface suit les critères ergonomiques de Bastien et Scapin : guidage (page en cours signalée, statuts codés par forme, mot et couleur), charge de travail réduite (résumé d'abord, détail à la demande), contrôle explicite (rien ne se déplie ou ne se filtre sans action du visiteur).
- Navigation au clavier, thèmes clair et sombre, mise en page lisible à 400 px de large.
