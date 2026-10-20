# Native Steam Link renderer (sketch)

Target: Valve `steamlink-sdk` — single-core ARMv7, ~256 MB app RAM, Vivante GC1000 (OpenGL ES 2.0), SDL 2.0.

The web player (`/display`) is the reference implementation. This native client mirrors it:

1. Poll `GET http://<cms>:3000/api/player?displayId=<id>` every 30 s (libcurl).
2. Cache JPEG/PNG assets to flash (stb_image, cap 1920px, total cache ≤ 200 MB, LRU).
3. Render the 7 templates as SDL textures / GLES quads using the same `buildTimeline()` table (background → image → eyebrow → title → was → promo → badge → body → hold → exit).
4. Animate transform/opacity only, ≤ 8 layers, ≤ 30 fps cap to protect thermals.
5. On poll failure keep playing the cached playlist; on missing asset draw the gradient fallback.

See `main.c` for the polling/render skeleton and the scene-layout notes per template.
