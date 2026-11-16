# Banc d'évaluation de QCM générés

Des modèles de langage exécutés en local écrivent des questions à choix multiples à partir d'un cours.
Le banc mesure ce qu'ils produisent, de deux façons : des contrôles automatiques et une notation humaine à l'aveugle.

## Protocole

1. **Même tâche pour tous.** Chaque modèle reçoit les mêmes passages (`cours.md`), la même consigne et les mêmes réglages : température nulle et graine fixe.
2. **Réponses conservées brutes.** `generer.py` enregistre la réponse de chaque modèle telle quelle dans `sorties/`. Une réponse mal formée est gardée et comptée comme un échec.
3. **Contrôles automatiques.** `evaluer.py` vérifie chaque question, sans rappeler les modèles :
   - format valide : un énoncé, quatre propositions distinctes, une bonne réponse ;
   - citation présente mot pour mot dans le passage ;
   - bonne réponse retrouvée dans la citation ;
   - bonne réponse pas nettement plus longue que les autres ;
   - question distincte des autres questions du même modèle.
4. **Notation humaine à l'aveugle.** `noter.py` mélange les questions de tous les modèles et masque leur origine. Pour chaque question : la réponse indiquée est-elle juste, est-elle la seule défendable, faut-il garder, corriger ou jeter la question.
5. **Croisement.** `evaluer.py` compare les deux jugements. Les contrôles automatiques repèrent les défauts de forme et les citations inventées. Ils ne disent pas si une question est juste ou utile : l'écart avec le jugement humain est ce que le banc cherche à montrer.

## Utilisation

Il faut Python 3.9 ou plus et [Ollama](https://ollama.com) avec au moins un modèle installé. Aucune bibliothèque à installer.

```
python generer.py        génère les questions avec les modèles installés
python evaluer.py        applique les contrôles et écrit resultats.json
python noter.py          ouvre la page de notation dans le navigateur
python evaluer.py        relancé après la notation, ajoute le croisement
python -m unittest       lance les tests
```

Sous Windows, les fichiers `lancer_*.bat` font la même chose d'un double-clic.

## Limites

- Un seul cours, court, et peu de questions par modèle : les écarts entre modèles sont indicatifs.
- Un seul évaluateur humain, donc pas de mesure d'accord entre évaluateurs.
- « Bonne réponse retrouvée dans la citation » compare des mots : c'est un indice, pas une preuve.
