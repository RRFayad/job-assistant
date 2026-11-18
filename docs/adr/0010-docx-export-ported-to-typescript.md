# `.docx` export ported from the Python sidecar (ADR-0009) to TypeScript, sidecar removed

ADR-0009's premise — no Node library replicates `python-docx`'s template-cloning OOXML approach — turned out to be wrong. `jszip` (package I/O) + `@xmldom/xmldom` (namespace-literal DOM manipulation) + `sharp` (image crop/resize) reproduce every primitive the export needed: deep-clone a paragraph/table, strip `w:divId`/comment anchors, rewrite run text/color, add a relationship + media part for an embedded photo, add an external relationship for a hyperlink. None of these needed python-docx's higher-level object model — only direct XML/zip manipulation, which the template-cloning design already relied on.

- `backend/src/profile/docx-export/` is the port: `ooxml.ts` (the python-docx-replacement primitives), `images.ts` (sharp crop/resize), `markdown-lite.ts` (segment/block parser, ported from `markdown_lite.py`), `docx-export.ts` (orchestration — mirrors `docx_export.py` 1:1).
- `docx-service/` (the FastAPI sidecar) is deleted. `backend/` generates `.docx` files in-process; `exportProfileDocxHandler` no longer proxies over HTTP.
- Verified by: unit tests against the full Profile shape, and a generated file round-tripped through `python-docx` itself (before deletion) to confirm structural parity — not just "it typechecks."

This removes a whole runtime (Python/`uv`), its own env vars/auth header, and the HTTP hop between `backend/` and the sidecar — at the cost of ADR-0009's original safety net (a mature, battle-tested library) now being hand-rolled. Any future OOXML quirk (a new picture layout, a new relationship type) needs its own direct fix in `ooxml.ts`, not a `python-docx` API call.
