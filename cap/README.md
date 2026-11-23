# Bauble Cap Maker

A browser configurator for a snap-on cap that fits the cylinder ledge of a lithophane sphere bauble (Classic LithophaneMaker Globe). Set the sizes, check the 3D preview, and download the STL files as a zip.

Two cap styles:

- **String lights**: a cap with a centre hole and side slot to feed 2–3 bulbs from a tree light string down into the bauble.
- **Micro lights** (LEDs on fine copper wire): a hollow spindle hangs from the cap. The wire runs down the middle and winds back up a spiral groove. The spiral starts below the bauble's cylinder (a bare stem you can set, 18 mm by default), so no lights are hidden in the neck, and two clip slots, one each side, hold the end of the lights where it finishes. An optional snap-on clip (a separate C-shaped part with a third of the ring cut away) pushes onto the stem from the side over the end of the wire, and can be glued if you want it permanent. There's also a cable cleat on top. Enter the lit length and LED spacing and the spiral spacing is worked out to fit.

Both styles have flex slots and a catch that snap over the bauble's ledge, and an optional hanging loop.

Everything prints without supports: the cap skirt down, the spindle disc down. The roof inside the cap is a 45° cone rather than a flat bridge, the hanging loop has a pointed top, and the spiral groove has a flat floor with a 45° face on the side that faces up when printed.

Everything runs in the browser. The page loads three.js and the Manifold geometry engine's script from cdn.jsdelivr.net, so the browser needs internet access. The Manifold WASM is embedded in `index.html`.

## Run with Docker

```bash
docker compose up -d --build
```

Then open http://localhost:8081. To use a different port, set `HTTP_PORT`, for example `HTTP_PORT=8090 docker compose up -d --build`.

The default is 8081 so it can run next to [bauble-image-tool](https://github.com/daveo2k/bauble-image-tool) on 8080.

## Deploy in Portainer

1. **Stacks → Add stack**, give it a name such as `bauble-cap`.
2. Choose **Repository**.
3. Repository URL: `https://github.com/daveo2k/bauble-cap`, reference `refs/heads/main`, compose path `docker-compose.yml`.
4. Optional: under **Environment variables**, add `HTTP_PORT` to change the host port (default 8081).
5. **Deploy the stack**. Portainer builds the image from the repo and starts it.

To update after a new commit, open the stack and click **Pull and redeploy**.

The image is always built from the repo (`pull_policy: build`) and never pulled from a registry, so no `docker login` is needed. `HTTP_PORT` sets both the host port and the port nginx listens on inside the container.

## Editing the page

`index.html` is generated. Edit `src/cap_configurator.src.html`, then rebuild:

```bash
python3 src/build_page.py path/to/manifold.wasm
```

## Without Docker

Open `index.html` directly in a browser, or serve it from any static web server.
