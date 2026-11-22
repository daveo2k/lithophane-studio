# BadgerTech Lithophane Studio

Turn photos into 3D-printable lithophanes in the browser: baubles, flat panels, curved panels and cylinders. Nothing is uploaded; all the work happens on your computer.

The studio bundles two companion tools:

- **Photo wrap** (`/wrap/`, from [bauble-image-tool](https://github.com/daveo2k/bauble-image-tool)) lays several photos round a bauble. Its **Send to Lithophane Studio** button passes the finished wrap straight into the studio.
- **End cap maker** (`/cap/`, from [bauble-cap](https://github.com/daveo2k/bauble-cap)) makes the snap-on cap. The studio opens it with the bauble's sizes already filled in.

## Using it

1. **Image**: drop a photo in, drag and zoom it to frame it, and adjust brightness and contrast. The preview shows how the print will look when it's lit.
2. **Shape**: pick a shape and its size (flat and curved panels can add snap-off scaffold fins to brace them while printing), the thinnest and thickest walls, and the detail level. The 3D preview has a *Lit from inside* view and a *Daylight* view.
3. **Print**: the studio builds the full-detail model, checks it, and gives you the STL and a print sheet for that shape.

Settings are kept in your browser between visits.

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
| `Dockerfile`, `nginx.conf.template`, `docker-compose.yml` | Container setup |

## Not in this version

- 3MF export. The download is STL only.
- Shapes beyond the four listed: no heart, lamp or night-light shapes yet.

## Open source used

- [three.js](https://threejs.org) (MIT), loaded from jsDelivr, for the 3D preview
- Jost and IBM Plex fonts (SIL Open Font License), from Google Fonts
- nginx (BSD-2-Clause), for serving the site
