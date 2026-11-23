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

## Where it runs

This tool is part of [Lithophane Studio](../README.md) and is served from `/wrap/` alongside the studio. It is built, run (Docker or Portainer) and deployed (Cloudflare) with the studio; see the main README.

`index.html` is self-contained apart from Google Fonts and its CDN libraries, so it also works opened directly in a browser. It uses the logo in the studio's `brand/` folder, which the build copies in next to it.
