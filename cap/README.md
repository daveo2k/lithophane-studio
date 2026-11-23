# Bauble Cap Maker

A browser configurator for a snap-on cap that fits the cylinder ledge of a lithophane sphere bauble (Classic LithophaneMaker Globe). Set the sizes, check the 3D preview, and download the STL files as a zip.

Two cap styles:

- **String lights**: a cap with a centre hole and side slot to feed 2–3 bulbs from a tree light string down into the bauble.
- **Micro lights** (LEDs on fine copper wire): a hollow spindle hangs from the cap. The wire runs down the middle and winds back up a spiral groove. The spiral starts below the bauble's cylinder (a bare stem you can set, 18 mm by default), so no lights are hidden in the neck, and two clip slots, one each side, hold the end of the lights where it finishes. An optional snap-on clip (a separate C-shaped part with a third of the ring cut away) pushes onto the stem from the side over the end of the wire, and can be glued if you want it permanent. There's also a cable cleat on top. Enter the lit length and LED spacing and the spiral spacing is worked out to fit.

Both styles have flex slots and a catch that snap over the bauble's ledge, and an optional hanging loop.

Everything prints without supports: the cap skirt down, the spindle disc down. The roof inside the cap is a 45° cone rather than a flat bridge, the hanging loop has a pointed top, and the spiral groove has a flat floor with a 45° face on the side that faces up when printed.

Everything runs in the browser. The page loads three.js and the Manifold geometry engine's script from cdn.jsdelivr.net, so the browser needs internet access. The Manifold WASM is embedded in `index.html`.

## Where it runs

This tool is part of [Lithophane Studio](../README.md) and is served from `/cap/` alongside the studio. It is built, run (Docker or Portainer) and deployed (Cloudflare) with the studio; see the main README.

`index.html` is self-contained apart from Google Fonts and its CDN libraries, so it also works opened directly in a browser. It uses the logo in the studio's `brand/` folder, which the build copies in next to it.

## Editing the page

`index.html` is generated. Edit `src/cap_configurator.src.html`, then rebuild:

```bash
python3 src/build_page.py path/to/manifold.wasm
```
