# Portfolio — style pixel / code

Le code du site (Vite + React + Tailwind). Vos photos se rangent dans le
dossier `images/`, à côté de ce dossier `site/`.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173

## Où modifier quoi

| Quoi | Où |
|---|---|
| Textes, coordonnées, couleur d'accent | `src/data/site.ts` |
| Photos de l'accueil, du portrait et des avis | dossier `images/` (à côté de `site/`), puis `node scripts/prepare-images.mjs` |
| Projets du portfolio | l'artefact « Projets du portfolio » sur claude.ai, bouton « Publier sur le site » |
| Cible de publication (local ou Hostinger) | `deploy.config.json` |

Les projets ne se modifient jamais à la main dans `src/data/projects.json` :
ce fichier est régénéré à chaque publication depuis l'artefact.
