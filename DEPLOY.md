# Getting this portfolio online

The site is a Vite build in `Portfolio/portfolio/`. GitHub Actions builds it on
every push to `main` and publishes the result to GitHub Pages —
`.github/workflows/deploy.yml` does the whole job. Nothing is built by hand and
`dist/` is no longer committed.

---

## 1. Push what is here

```sh
git add -A
git commit -m "Set up GitHub Pages deployment"
git push
```

## 2. Turn Pages on (once)

GitHub → your repo → **Settings** → **Pages** → **Build and deployment** →
**Source: GitHub Actions**. Nothing else on that page needs touching yet.

## 3. Watch the first deploy

The **Actions** tab shows a "Deploy to GitHub Pages" run. When it goes green the
site is live at:

```
https://xanderv-2364363.github.io/Portfolio/
```

Every later push to `main` redeploys automatically. You can also re-run a deploy
by hand from Actions → Deploy to GitHub Pages → *Run workflow*.

---

## 4. Buy the domain

Any registrar works. Cheap and DNS-friendly: **Cloudflare Registrar** (at cost,
no markup), **Porkbun**, **Namecheap**. For a `.be` domain: **Combell**,
**Openprovider**, **Versio**. Expect roughly €10–15 a year for `.com`, €10–20
for `.be`.

You only need the domain itself. Skip the hosting, email and "web builder"
upsells — GitHub Pages is the host, and it is free.

## 5. Point the DNS at GitHub

In the registrar's DNS panel, for the apex domain (`example.com`) add four
**A** records, all with host `@`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

and, for IPv6, four **AAAA** records, host `@`:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

Then one **CNAME** record so `www` works too:

```
host: www    value: xanderv-2364363.github.io.
```

If you would rather use only `www.example.com`, the single CNAME record is
enough and the A/AAAA records can be skipped.

DNS changes are usually live within minutes, but can take a few hours.

## 6. Tell the repo about the domain

Two things, done together:

**a.** Create `Portfolio/portfolio/public/CNAME` containing one line — your
domain, no `https://`, no trailing slash:

```
example.com
```

This file is what flips the build from `/Portfolio/` to the root path. The
workflow checks for it and sets the base automatically, so this single file is
the whole code change. Commit and push it.

**b.** GitHub → **Settings** → **Pages** → **Custom domain** → type the same
domain → **Save**. GitHub runs a DNS check; once it passes, tick
**Enforce HTTPS** (the certificate can take up to 24 hours to issue, usually
much less).

Keep the two in sync — if you ever change the domain, change both.

---

## Local development

```sh
cd Portfolio/portfolio
npm install
npm run dev
```

The images, models, files and CVs are served from the repo root by a small Vite
plugin (`rootContent` in `vite.config.ts`), in dev and in the build alike, so
the JSON data files stay the single source of truth.

## Base paths, in one paragraph

On a project page the site lives under `/Portfolio/`, so a hardcoded
`/images/foo.png` would 404. Every runtime asset URL therefore goes through
`asset()` in `src/lib/asset.ts`, which puts Vite's `BASE_URL` in front. Locally
and on a custom domain the base is `/` and `asset()` changes nothing. If you add
new asset paths in code, run them through `asset()` (or `assetUrl()` for the
paths that come out of the JSON files).

## Known weight problem

The hero scene loads about **80 MB of 3D models** before it can show anything.
That is fine on your machine and rough on a phone. It does not block the deploy,
but it is the first thing worth fixing:

- compress the `.glb` files with Draco or Meshopt
  (`npx @gltf-transform/cli optimize in.glb out.glb --compress draco`) — usually
  5–15× smaller;
- the two CV PDFs are 24 MB and 46 MB; re-export them at screen resolution.

`Portfolio/models/trash/` and the built `dist/` are still in the git *history*
(the repo is ~180 MB to clone) even though they are no longer tracked. Only a
history rewrite removes them.
