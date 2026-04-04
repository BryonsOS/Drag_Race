# Sick Off The Line V2

A GitHub-ready static web game inspired by a driver's-eye view from a street car at the drag strip.

## What's in V2

- Driver-perspective drag strip scene
- Christmas tree sequence with 3 red, 2 yellow, then green
- Tap / click / keyboard reaction timing
- Red-light foul handling
- Best, last, average, and run count tracking with `localStorage`
- Sponsor signage using the Sick The Magazine logo asset
- Clean folder structure for easy GitHub upload
- GitHub Pages workflow included

## Project structure

```text
reaction_game_v2/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── assets/
│   └── sick-the-magazine-logo.jpg
├── css/
│   └── styles.css
├── js/
│   └── game.js
└── index.html
```

## Run locally

Because this is a plain static site, you can open `index.html` directly in your browser.

## Upload to GitHub

1. Create a new GitHub repository.
2. Upload all files from this folder to the root of that repo.
3. Commit and push.
4. In GitHub, open **Settings → Pages**.
5. If needed, set the source to **GitHub Actions**.
6. The included workflow should deploy the game automatically.

## Optional terminal commands

If you want to upload with git from your computer:

```bash
git init
git add .
git commit -m "Initial commit - Sick Off The Line V2"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Notes

- Stats are stored in the browser only.
- No framework or build step is required.
- This makes it ideal for GitHub Pages hosting.
