# Vaseworks

A browser-based vase-mode STL studio. Sculpt parametric vases — base profile,
waist, twist, ring noise, vertical ribs — preview them live in 3D, and export
single-wall STL files ready to drop into your slicer for vase-mode printing.

The whole app is a single static HTML file (React + Babel via CDN, geometry
math hand-written, no build step required).

---

## Requirements

- **Node.js 18+** (only needed for the local dev server and build script — the
  app itself is plain HTML/JS).
- A modern browser with WebGL2.

## Quick start

```bash
# 1. install
npm install

# 2. dev server with live reload-on-refresh at http://localhost:5173
npm run dev

# 3. build a deployable artifact in ./dist
npm run build

# 4. preview the build at http://localhost:4173
npm run preview
```

## Project layout

```
vaseworks/
├── src/
│   └── index.html      # the entire app (React + Babel from CDN)
├── scripts/
│   └── build.mjs       # copies src/ → dist/
├── dist/               # build output (generated, gitignored)
├── package.json
├── netlify.toml        # one-click Netlify deploy config
├── vercel.json         # one-click Vercel deploy config
├── Dockerfile          # containerised static-serve
├── .dockerignore
├── .gitignore
└── README.md
```

## Scripts

| Command           | What it does                                          |
|-------------------|-------------------------------------------------------|
| `npm run dev`     | Serves `src/` on http://localhost:5173                |
| `npm run build`   | Copies `src/` → `dist/`                               |
| `npm run preview` | Serves the built `dist/` on http://localhost:4173     |
| `npm run clean`   | Removes `dist/`                                       |

## Deploying

The output is a static folder — host it anywhere.

### Netlify

```bash
npm run build
npx netlify deploy --dir=dist --prod
```

Or connect the repo; `netlify.toml` already wires `npm run build` → `dist/`.

### Vercel

```bash
npm run build
npx vercel --prod dist
```

Or import the repo; `vercel.json` sets the build command and output directory.

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

### Docker

```bash
docker build -t vaseworks .
docker run -p 8080:80 vaseworks
# open http://localhost:8080
```

### Plain static host (S3, Cloudflare Pages, nginx, …)

Upload the contents of `dist/` to the document root. There is no server-side
component, no API, and no routing — a single `index.html` is all you need.

## Offline / air-gapped use

The app fetches React, ReactDOM, Babel-Standalone, and Space Grotesk from
public CDNs at runtime. To run fully offline, vendor those four assets into
`src/` and rewrite the four `<script src="…">` / `<link href="…">` tags at
the top of `src/index.html` to point at the local copies.

## License

This bundle is yours to use, modify, and deploy. The third-party CDN scripts
(React, ReactDOM, Babel) retain their respective MIT licenses.
