# NeonCase Sim (No Backend)

A single-page, fully client-side CSGO-inspired clicker + case opening + casino simulation designed to run free in a browser, including iPad workflows.

## What is included

- Clicker economy with upgrades, auto-click, streak bonus, loyalty rewards.
- Case opening with simulated rarity odds, multi-open, knife gold effect, float + pattern seed.
- Inventory with rarity filters, search, sort, favorites, collection tracking.
- Casino mini-games: blackjack, roulette, coinflip, crash, jackpot, mines, slots, plinko.
- Case battles (1v1/team/FFA mode selector), bot-driven outcomes.
- Missions, daily rewards, level + XP + rank progression, rebirth.
- Market simulation: dynamic prices, trends graph, supply/demand events, auction log, trade offer simulation.
- Bank with deposit/withdraw, passive interest, loan risk mechanic.
- Login/signup modal (localStorage), admin actions gated by username `d3vi0us`.
- Dark neon UI style inspired by the provided references.

## iPad-friendly, free, no-download workflow (VS Code for Web)

> This project is intentionally no-backend and no-install required. You can use Safari/Chrome on iPad.

### Option A: GitHub + vscode.dev (recommended)

1. Create a free GitHub account if you do not have one.
2. Create a new repository and upload these files (`index.html`, `styles.css`, `app.js`).
3. On iPad, open Safari and visit:
   - `https://vscode.dev/github/<your-username>/<repo-name>`
4. Edit files directly in browser (touch keyboard compatible).
5. Use GitHub UI to commit changes from web.
6. Preview by opening `index.html` in GitHub Pages:
   - In repo settings, enable **Pages** from `main` branch root.
   - Wait for deploy, then open your generated URL.

### Publish this project to GitHub right now (copy/paste commands)

If you already have this repo locally and just want it on GitHub:

1. Create a new empty repository on GitHub (for example `neoncase-sim`).
2. Run the commands below in this folder:

```bash
git branch --show-current
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin <your-current-branch>
```

If `origin` already exists, update it:

```bash
git remote set-url origin https://github.com/<your-username>/<your-repo>.git
git push -u origin <your-current-branch>
```

If you want the branch to be `main`:

```bash
git branch -m <your-current-branch> main
git push -u origin main
```

### Option B: StackBlitz (fully browser-based)

1. Open `https://stackblitz.com` on iPad.
2. Create a new HTML/CSS/JS project.
3. Paste the file contents.
4. Live preview updates instantly, no app install needed.

### Option C: CodePen (quick prototype)

1. Open `https://codepen.io/pen`.
2. Paste HTML/CSS/JS into respective panels.
3. Save/share instantly.

## How to extend each major feature

1. **All CSGO guns/knives + cases**
   - Replace demo arrays in `app.js` (`weapons`, `cases`) with full lists.
   - Add skin tables keyed by case and weapon.
2. **Exact CSGO chances**
   - Adjust `rarities` probability table in `app.js`.
   - Add StatTrak/souvenir and special-case exceptions if desired.
3. **More accurate case animation**
   - Replace simple text roll with horizontal reel DOM animation.
   - Trigger per-rarity effects and sound.
4. **Advanced marketplace**
   - Expand `market` logic with per-item supply counters.
   - Add listing objects with expiry timestamps.
5. **Trade system simulation**
   - Track offer states, cooldown timers, reputation deltas in localStorage.
6. **Leaderboards / clans / chat**
   - For pure no-backend mode, simulate bots and local player rank.
   - For real multiplayer later, add backend (Supabase/Firebase).
7. **Battle pass tiers**
   - Add free/premium tier JSON and per-level rewards.
8. **Seasonal events**
   - Create event config objects for double XP, crash, limited cases.
9. **UI parity with references**
   - Tune gradients, typography, glow, card spacing in `styles.css`.
   - Add item thumbnails and animated borders.

## Notes

- This is simulation-only and local to the browser (`localStorage`).
- Data clears if storage is reset.
- Not connected to real Steam economy, betting, or real-money systems.
