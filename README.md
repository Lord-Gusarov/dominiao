# Dominiao

Lleva la cuenta. Domina la mesa.

A domino scoreboard app — track scores, manage teams, and keep the game moving. Installable as a PWA for offline use.

## Usage

Open [ghornedo.com/dominiao](https://ghornedo.com/dominiao) on any device, or serve `index.html` locally.

## Tech

Static `index.html` + `css/styles.css` + `js/app.js`, with self-hosted fonts in `fonts/`. No build step, no dependencies. A service worker (`sw.js`) precaches the app so it keeps working offline (or when the server is down) after the first visit, and `manifest.json` enables PWA installation.

## Releasing

The site is served straight from this directory by nginx, so whatever is checked out on `main` here is live.

After changing any app file, run `./bump-version.sh` before committing. It bumps the `?v=` cache-busting version in `index.html` and the service worker's cache name and precache list in `sw.js`, so clients fetch the new files instead of cached ones.
