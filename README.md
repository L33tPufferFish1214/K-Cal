# Kcal Family Tracker

Mobile-first calorie and nutrition tracking app for multiple local profiles. The app is fully client-side: profile data, PIN hashes, food logs, history, and goals stay in each browser's IndexedDB.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://127.0.0.1:5173/`.

## Verify

```bash
npm run lint
npm run test
npm run build
```

## Push to GitHub

Create an empty GitHub repository first, then run:

```bash
git add .
git commit -m "Build calorie tracker MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## GitHub Pages

This repo includes `.github/workflows/pages.yml`. In GitHub, open the repo settings, go to Pages, and set the source to GitHub Actions. Every push to `main` or `master` will build the app and deploy `dist`.

The Vite config uses `base: './'` so the app can run from either a user site or a project site path like `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

## Privacy Notes

Safe to commit:

- `src/`, `public/`, `package.json`, `package-lock.json`, TypeScript/Vite config, GitHub Actions workflow, README.

Do not commit:

- `.env` files, API keys, screenshots containing personal health data, exported browser data, `node_modules`, `dist`, logs, or local database dumps.

Important limitations:

- A public GitHub Pages site is public on the internet. Anyone can open the app, but they will only see their own browser-local data.
- A private GitHub repository can hide source code if your GitHub plan supports Pages from private repositories, but the published Pages site may still be public unless you have enterprise private Pages access.
- PINs are a local convenience lock, not strong security for sensitive health data on a shared device.
- There is no cloud sync. Family members on different phones/browsers will have separate local data.

