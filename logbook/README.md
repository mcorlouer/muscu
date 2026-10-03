# Logbook musculation

App web perso : programme d'entraînement, saisie des séries, chrono de repos, records.
Front sur GitHub Pages, données dans Google Sheets via Apps Script.

## Contenu

- `index.html` : toute l'application
- `manifest.json`, `icon-*.png` : ajout à l'écran d'accueil
- `version.json` : numéro de version, à incrémenter à chaque mise à jour
- `apps-script/Code.gs` : l'API à coller dans Google Apps Script

`programme.json` n'est pas dans le dépôt (il est public) : il s'importe depuis l'app et vit dans le Sheet.

## Installation

### 1. Google Sheet et Apps Script
1. Créer un Google Sheet vide, par exemple « Logbook ».
2. Extensions > Apps Script. Remplacer le contenu par `apps-script/Code.gs`. Enregistrer.
3. Choisir la fonction `setup` et cliquer sur Exécuter. Accepter les autorisations. Les onglets Series, Seances, Modifications et Programme sont créés.
4. Paramètres du projet (roue dentée) : fuseau horaire Europe/Paris. Puis Propriétés du script : ajouter `TOKEN` avec votre mot de passe.
5. Déployer > Nouveau déploiement > type Application Web. Exécuter en tant que : moi. Qui a accès : tout le monde. Copier l'URL qui se termine par `/exec`.

Après une modification de `Code.gs` : Déployer > Gérer les déploiements > modifier > Nouvelle version (l'URL ne change pas).

### 2. GitHub Pages
1. Créer un dépôt, pousser ces fichiers.
2. Settings > Pages > Deploy from a branch > `main`, dossier `/ (root)`.
3. L'app est en ligne sur `https://<compte>.github.io/<depot>/`.

### 3. Sur l'iPhone
1. Ouvrir l'adresse dans Safari, Partager > Sur l'écran d'accueil.
2. Ouvrir l'app depuis l'icône. Réglages : coller l'URL `/exec`, le mot de passe, Enregistrer et tester.
3. Importer le programme : choisir `programme.json` ou coller son contenu.
4. Si des séries ont été notées à la main, les reporter dans Réglages > Saisie manuelle.

## Mettre à jour l'app

À chaque modification : changer `APP_VERSION` dans `index.html` **et** `version` dans `version.json` (même valeur), puis pousser. L'app détecte la nouvelle version et se recharge seule. En dernier recours : Réglages > Forcer la mise à jour.

## À tester tôt sur l'iPhone

- Le son de fin de repos : iOS peut le couper si le téléphone est en mode silencieux. Le flash plein écran reste toujours visible.
- L'écran qui reste allumé pendant la séance (Wake Lock, iOS 16.4 et plus).
- La vibration n'existe pas pour les apps web sur iPhone.

## Fonctionnement

- Chaque série validée part immédiatement dans le Sheet. Sans réseau, elle attend dans le téléphone et repart automatiquement.
- Charges cibles : +pas si toutes les séries ont atteint le haut de la fourchette, sinon même charge. Au changement de phase, calcul depuis le meilleur 1RM estimé (Epley). Décharge : -10 %.
- Séance non faite : l'app propose de la décaler (tout le planning glisse) ou de la sauter.
- Remplacement d'exercice : juste aujourd'hui, ou pour la suite du bloc (onglet Modifications).
