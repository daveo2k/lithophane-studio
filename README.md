# BadgerTech Lithophane Studio

Turn photos into 3D-printable lithophanes in the browser: baubles, flat panels, curved panels and cylinders. Nothing is uploaded; all the work happens on your computer.

The site has two companion tools, which live in this repository and deploy with the studio:

- **Photo wrap** (`/wrap/`, in [`wrap/`](wrap/README.md)) lays several photos round a bauble. Where a photo stops short of the top or bottom, it fades into the empty space. Its **Send to Lithophane Studio** button passes the finished wrap straight into the studio.
- **End cap maker** (`/cap/`, in [`cap/`](cap/README.md)) makes the snap-on cap. The studio opens it with the bauble's sizes already filled in.

Both used to be separate repositories (bauble-image-tool and bauble-cap); their history was brought in with them.

## Using it

1. **Shape**: pick a shape and its size (baubles get a rounded fillet where the sphere meets the neck, 3 mm by default, for a stronger join; flat and curved panels can add snap-off scaffold fins to brace them while printing), the thinnest and thickest walls, and the detail level. **Limit overhangs** (on by default) turns long sharp dark-over-light steps (5 mm or more side to side), such as the edge of a photo in a wrap, into 45° ramps so they print without a ledge. Short steps, such as fine detail, are left alone. The 3D preview has a *Lit from inside* view and a *Daylight* view.
2. **Image**: drop a photo in. The frame already matches your shape and size, and the page tells you the best photo size. Then drag and zoom it to frame it, and adjust brightness and contrast. The preview shows how the print will look when it's lit.
3. **Print**: the studio builds the full-detail model, checks it, and gives you the STL and a print sheet for that shape.

Settings are kept in your browser between visits.

## Hosting it on Cloudflare

Cloudflare builds and deploys the site straight from this repository. `build.sh` puts the whole site, wrap and cap tools included, into `dist/`, and `wrangler.jsonc` tells Cloudflare to serve that folder.

### First-time setup

1. In the Cloudflare dashboard, go to **Workers & Pages → Create** and import this GitHub repository.
2. Use these settings:

   | Setting | Value |
   |---|---|
   | Project name | `lithophane-studio` (must match `name` in `wrangler.jsonc`) |
   | Build command | `sh build.sh` |
   | Deploy command | `npx wrangler deploy` |

3. Deploy. The site goes live at the `workers.dev` address Cloudflare shows.
4. To use your own domain, open the Worker's **Settings → Domains & Routes → Add → Custom domain**, for example `lithophane.example.com`. The domain is already on Cloudflare, so it creates the DNS record and HTTPS certificate for you.
5. For the domain, go to **SSL/TLS → Edge Certificates** and turn on **Always Use HTTPS**, so `http://` links redirect to `https://`. Cloudflare issues and renews the certificate itself, so there is no Let's Encrypt or certbot to set up.

### Updates

Every push to `main` rebuilds and redeploys the whole site, the wrap and cap tools included. If a new version has a problem, the Worker's **Deployments** tab can put an earlier version back.

To check a build on your own computer, run `sh build.sh` (on Windows, in Git Bash), then `npx serve dist`.

## Running it with Docker or Portainer

```bash
docker compose up -d --build
```

Then open `http://<host>:8082`. Set `HTTP_PORT` to use a different port.

In Portainer, add a **Stack** from this repository (Repository → `docker-compose.yml`).

The stack serves the studio and both tools. Rebuild it (**Pull and redeploy**) to pick up changes.

## Files

| File | What it is |
|---|---|
| `index.html` | Home page |
| `studio.html` | The studio: image, shape and print steps, plus the three.js preview |
| `geometry.js` | Builds the lithophane meshes (closed, watertight surfaces with no boolean operations) and writes the STL files |
| `wrap/` | The photo wrap tool, served at `/wrap/` |
| `cap/` | The end cap maker, served at `/cap/`; `cap/src/` holds the source its page is generated from |
| `brand/`, `site.webmanifest` | BadgerTech logo and icons, shared by all three tools |
| `build.sh`, `_headers`, `wrangler.jsonc` | Builds the static site into `dist/` and tells Cloudflare where to find it |
| `Dockerfile`, `nginx.conf.template`, `docker-compose.yml` | Container setup |

## Not in this version

- 3MF export. The download is STL only.
- Shapes beyond the four listed: no heart, lamp or night-light shapes yet.

## Open source used

- [three.js](https://threejs.org) (MIT), loaded from jsDelivr, for the 3D preview
- Jost and IBM Plex fonts (SIL Open Font License), from Google Fonts
- [Manifold](https://github.com/elalish/manifold) (Apache-2.0), in the end cap maker, for its solid geometry
- nginx (BSD-2-Clause), for serving the site
