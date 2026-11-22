# BadgerTech Lithophane Studio

Turn photos into 3D-printable lithophanes in the browser: baubles, flat panels, curved panels and cylinders. Nothing is uploaded; all the work happens on your computer.

The studio bundles two companion tools:

- **Photo wrap** (`/wrap/`, from [bauble-image-tool](https://github.com/daveo2k/bauble-image-tool)) lays several photos round a bauble. Its **Send to Lithophane Studio** button passes the finished wrap straight into the studio.
- **End cap maker** (`/cap/`, from [bauble-cap](https://github.com/daveo2k/bauble-cap)) makes the snap-on cap. The studio opens it with the bauble's sizes already filled in.

## Using it

1. **Shape**: pick a shape and its size (flat and curved panels can add snap-off scaffold fins to brace them while printing), the thinnest and thickest walls, and the detail level. The 3D preview has a *Lit from inside* view and a *Daylight* view.
2. **Image**: drop a photo in. The frame already matches your shape and size, and the page tells you the best photo size. Then drag and zoom it to frame it, and adjust brightness and contrast. The preview shows how the print will look when it's lit.
3. **Print**: the studio builds the full-detail model, checks it, and gives you the STL and a print sheet for that shape.

Settings are kept in your browser between visits.

## Hosting it on Cloudflare Pages

`build.sh` builds the whole site into `dist/`. That includes `/wrap/` and `/cap/`, cloned from their own repositories, exactly as the Docker image does. Cloudflare Pages runs it on every push to `main`.

### First-time setup

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Import an existing Git repository**. If it offers a Worker first, choose the **Pages** tab.
2. Connect GitHub and pick `lithophane-studio`. You can give Cloudflare access to only that repository.
3. Use these build settings:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | `sh build.sh` |
   | Build output directory | `dist` |

4. Select **Save and Deploy**. The site goes live at `https://<project>.pages.dev`.
5. To use your own domain, open the project's **Custom domains** tab and add one, for example `lithophane.example.com`. The domain is already on Cloudflare, so it creates the DNS record and HTTPS certificate for you.

### Keeping it up to date

- **Changes to this repository** deploy by themselves: every push to `main` rebuilds the site. Pushes to other branches get their own preview URL.
- **Changes to the photo wrap or end cap tools** need a rebuild of this site. To do that automatically:
  1. In the Pages project, go to **Settings → Builds → Deploy hooks**, add a hook for the `main` branch, and copy its URL.
  2. In **both** `bauble-image-tool` and `bauble-cap`, add a repository secret called `CF_PAGES_DEPLOY_HOOK` (**Settings → Secrets and variables → Actions**) with that URL.
  3. In both repositories, add `.github/workflows/rebuild-lithophane-studio.yml`:

     ```yaml
     name: Rebuild Lithophane Studio
     on:
       push:
         branches: [main]
       workflow_dispatch:
     jobs:
       rebuild:
         runs-on: ubuntu-latest
         steps:
           - run: curl -fsS -X POST "${{ secrets.CF_PAGES_DEPLOY_HOOK }}"
     ```

  Treat the deploy hook URL as a password: anyone who has it can start builds.

To check a build on your own computer, run `sh build.sh`, then `npx serve dist`.

## Running it with Docker or Portainer

```bash
docker compose up -d --build
```

Then open `http://<host>:8082`. Set `HTTP_PORT` to use a different port.

In Portainer, add a **Stack** from this repository (Repository → `docker-compose.yml`).

Each build clones the latest `main` of bauble-image-tool and bauble-cap into `/wrap/` and `/cap/`. Rebuild the stack to pick up changes to either tool.

## Files

| File | What it is |
|---|---|
| `index.html` | Home page |
| `studio.html` | The studio: image, shape and print steps, plus the three.js preview |
| `geometry.js` | Builds the lithophane meshes (closed, watertight surfaces with no boolean operations) and writes the STL files |
| `brand/`, `site.webmanifest` | BadgerTech logo and icons |
| `build.sh`, `_headers` | Static build for Cloudflare Pages |
| `Dockerfile`, `nginx.conf.template`, `docker-compose.yml` | Container setup |

## Not in this version

- 3MF export. The download is STL only.
- Shapes beyond the four listed: no heart, lamp or night-light shapes yet.

## Open source used

- [three.js](https://threejs.org) (MIT), loaded from jsDelivr, for the 3D preview
- Jost and IBM Plex fonts (SIL Open Font License), from Google Fonts
- nginx (BSD-2-Clause), for serving the site
