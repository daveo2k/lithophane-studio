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

The site is published by uploading it by hand, so nothing goes live until you choose. Cloudflare Pages has no FTP, but its **Direct Upload** does the same job: you drag a folder or zip into the dashboard.

### Build the files

Run `sh build.sh`. On Windows, use Git Bash. It puts the whole site into `dist/`, including `/wrap/` and `/cap/`, which it clones from their own repositories.

To check the result before uploading, run `npx serve dist` and open the address it prints.

### First upload

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Use direct upload** (it may say **Upload assets**). If it offers a Worker first, choose the **Pages** tab.
2. Name the project. The name becomes `https://<name>.pages.dev`.
3. Drag in the **contents** of `dist/`, or a zip of them. `index.html` must be at the top level, not inside a folder.
4. Select **Deploy site**.
5. To use your own domain, open the project's **Custom domains** tab and add one, for example `lithophane.example.com`. The domain is already on Cloudflare, so it creates the DNS record and HTTPS certificate for you.

### Updating it

1. Run `sh build.sh` again.
2. In the project, select **Create deployment** (or **Upload**), drag in the new `dist/` contents, and deploy to **Production**.

Every upload is kept. If a new version has a problem, open the project's **Deployments** list, pick the last good one, and select **Rollback to this deployment**.

You can also upload from the command line, with no dashboard: `npx wrangler pages deploy dist --project-name <name>`. The first run asks you to log in to Cloudflare.

A project created by upload stays an upload project. It can't later be connected to GitHub; that needs a new project.

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
| `build.sh`, `_headers` | Builds the static site into `dist/` for Cloudflare Pages |
| `Dockerfile`, `nginx.conf.template`, `docker-compose.yml` | Container setup |

## Not in this version

- 3MF export. The download is STL only.
- Shapes beyond the four listed: no heart, lamp or night-light shapes yet.

## Open source used

- [three.js](https://threejs.org) (MIT), loaded from jsDelivr, for the 3D preview
- Jost and IBM Plex fonts (SIL Open Font License), from Google Fonts
- nginx (BSD-2-Clause), for serving the site
