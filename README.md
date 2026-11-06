# Jay Damani: Portfolio

A static portfolio site: plain HTML, CSS and JavaScript, no build step.

## Structure

```
portfolio/
├── index.html                 Page markup and content
├── css/
│   ├── tokens.css             Colors, spacing, fonts (change the palette here)
│   ├── base.css               Reset, typography, buttons
│   ├── layout.css             Nav, hero, stats strip, about, contact
│   ├── components.css         Cards, LeetCode panel, heatmap, projects, timeline
│   ├── animations.css         Scroll reveal, hero intro, heatmap wave
│   └── responsive.css         Tablet and phone breakpoints
├── js/
│   ├── calendar.js            Heatmap date logic (pure, unit-tested)
│   ├── heatmap.js             Heatmap rendering and tooltip
│   ├── leetcode.js            Fills the LeetCode panel from the data file
│   ├── motion.js              Scroll reveal and count-up numbers
│   ├── nav.js                 Mobile menu
│   └── main.js                Starts everything
├── data/leetcode-data.js      LeetCode numbers + daily submissions
├── assets/                    Photo and favicon
├── scripts/
│   ├── serve.mjs              Cross-platform static HTTP server
│   └── update-leetcode.mjs    Pulls real LeetCode data
├── tests/logic.test.mjs       Unit tests
└── .github/workflows/         Optional daily auto-refresh of LeetCode data
```

## Run it

Open `index.html` in a browser, or serve the folder:

```
npm start        # then visit http://localhost:8000
```

## Make the heatmap real

The shipped `data/leetcode-data.js` has your real totals (239 solved, 310 submissions,
72 active days, 24-day streak) but the day-by-day squares are an estimate.
To replace them with your actual LeetCode activity:

```
node scripts/update-leetcode.mjs Jay_Damani
```

This rewrites `data/leetcode-data.js` and removes the "approximate" note from the site.
Run it from a computer with normal internet access. To refresh automatically every day
on GitHub, keep `.github/workflows/update-leetcode.yml` in the repo.

## Edit content

- Text, projects, links: `index.html`
- Colors: `css/tokens.css`
- Tests: `npm test`

## Deploy (GitHub Pages)

Push the folder to a repo, then Settings > Pages > Deploy from branch > `main` / root.
