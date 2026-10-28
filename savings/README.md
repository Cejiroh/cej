# Ipon — Savings Tracker

Mobile-first savings & expense app (React + Vite + Tailwind). Your Google Sheet is the database, reached through a tiny Apps Script web app. Data is also cached on the phone, so it works offline and syncs when connected.

## Deploy on GitHub Pages
1. Create a repo and push the contents of this folder to the `main` branch.
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) builds and publishes on every push.
   Your app will be at `https://<user>.github.io/<repo>/`.

(Manual alternative: `npm install && npm run build`, then publish the `dist/` folder.)

## Connect your Google Sheet
Open the app → ⚙ Settings → **Google Sheet connection**. Copy the script, paste it into Extensions → Apps Script of your sheet, run `setup` once, deploy as a Web app (Execute as *Me*, access *Anyone*), paste the URL into the app, then tap **Upload to sheet** once to send your starting accounts and budgets.

## Develop
```
npm install
npm run dev
```
