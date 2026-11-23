"""Build ../index.html from cap_configurator.src.html.

Embeds the Manifold geometry engine (manifold-3d@3.0.0/manifold.wasm) as base64,
so the page needs no separate .wasm file.

    python3 src/build_page.py path/to/manifold.wasm

Get the .wasm with: npm pack manifold-3d@3.0.0 (it is in package/manifold.wasm).
"""
import base64
import sys
from pathlib import Path

here = Path(__file__).parent
wasm = Path(sys.argv[1]).read_bytes()
src = (here / "cap_configurator.src.html").read_text()
out = src.replace("__MANIFOLD_WASM_BASE64__", base64.b64encode(wasm).decode())
dest = here.parent / "index.html"
dest.write_text(out)
print(f"wrote {dest} ({len(out) / 1e6:.2f} MB)")
