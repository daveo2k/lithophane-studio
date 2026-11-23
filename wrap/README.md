# Lithophane Bauble Wrap

A browser tool for building the 360° wrap image for a lithophane sphere (Classic LithophaneMaker Globe, "Fit Image to Sphere" ticked).

- Enter the sphere diameter and cylinder outer diameter. The image size follows from
  angular height = 180° − asin(cylinder Ø ÷ sphere Ø), so the site never crops the ends.
  For example, a 100 mm sphere with a 36 mm cylinder gives 158.90° and a 3625 × 1600 px image.
- Choose 1 to 4 photos, then set each one's width, zoom, pan and mirror.
- Spread the photos around the full 360°, or across the front 180° with a plain back half.
- Where a photo stops short of the top or bottom of the wrap, it fades into the empty space (8 mm by default), so the print has no ledge at the photo's edge.
- You choose the image height; the width is worked out from the sphere and cylinder. The tool shows the minimum height LithophaneMaker needs at 0.25 mm/px.
- Choose the fade at each seam: crossfade, fade to white, fade to black or hard cut, with straight, wavy or slanted seams.
- Preview the wrap on a sphere hanging from its cylinder.
- Save the full-size PNG, either upright or rotated 180° for upload, in colour or greyscale.

Everything runs in the browser. Photos never leave your machine, and your work is kept in that browser between visits.

## Run with Docker

```bash
docker compose up -d --build
```

Then open http://localhost:8080. To use a different port, set `HTTP_PORT`, for example `HTTP_PORT=8090 docker compose up -d --build`.

## Deploy in Portainer

1. **Stacks → Add stack**, give it a name such as `bauble-image-tool`.
2. Choose **Repository**.
3. Repository URL: `https://github.com/daveo2k/bauble-image-tool`, reference `refs/heads/main`, compose path `docker-compose.yml`.
4. Optional: under **Environment variables**, add `HTTP_PORT` to change the host port (default 8080).
5. **Deploy the stack**. Portainer builds the image from the repo and starts it.

To update after a new commit, open the stack and click **Pull and redeploy**.

The image is always built from the repo (`pull_policy: build`) and never pulled from a registry, so no `docker login` is needed. `HTTP_PORT` sets both the host port and the port nginx listens on inside the container.

Don't pick a port that browsers refuse to open, such as 5060 or 5061 (used by phone systems), 6000, or 6665–6669. The container still runs and shows as healthy, but the browser shows "This site can't be reached" (`ERR_UNSAFE_PORT`). Ports such as 8080, 8090 or 5080 work.

## Without Docker

`index.html` is self-contained apart from Google Fonts. Open it directly in a browser, or serve it from any static web server.
