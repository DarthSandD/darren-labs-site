# 3D Assets — Darren Labs site

Every 3D model on this site is a real downloaded model with a verified open license.
No paid, restricted, or unclear-license model is used. CC0 needs no attribution;
the site footer still credits all models as a courtesy (the BSD-3-Clause pylon
requires attribution — see its entry).

## Used

### 1. Robot (Studio chapter — "Agent")
- **File:** `models/robot-expressive.glb` (463,988 bytes)
- **What it is:** RobotExpressive — an expressive robot with idle animation,
  used as the "Agent" standing next to Darren in the Studio chapter.
- **Source page:** https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive
- **Download URL:** https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
- **License:** CC0 1.0 — confirmed in the model's README in the three.js repo:
  "Model by Tomás Laulhé (Quaternius). Before using this model on a project,
  consider supporting the creator's Patreon. CC0 1.0."
  (Modifications by Don McCurdy: facial-expression morph targets, FBX2GLTF conversion.)
- **License link:** https://creativecommons.org/publicdomain/zero/1.0/
- **Author:** Tomás Laulhé (Quaternius)
- **Modifications by Darren Labs:** none. File used as downloaded.
- **Maps (verified 2026-10-19 by parsing the GLB):** NONE — and that is
  as-downloaded, not a repack loss. The file has no `textures` / `images`
  at all; its 3 materials (Grey / Main / Black) use scalar PBR factors only
  (`baseColorFactor`, `metallicFactor` 0.1, `roughnessFactor` 0.9).
  It is therefore NOT diffuse-only by omission — there were never any maps
  to drop. It looks better now because of the fixed lighting + IBL env
  (ACES, RoomEnvironment), not because of added textures.
- **Replaces:** the three procedural "agent tool" blocks (hammer, magnifier, pen).

### 2. Generator (VoltWorks chapter — "Generator")
- **File:** `models/portable-generator.glb` (3,430,432 bytes)
- **What it is:** "Portable Generator" — a real portable generator model,
  used as the power-equipment centerpiece of the VoltWorks substation scene.
  It is labelled "Generator" in the 3D caption. It is NOT labelled a transformer.
- **Source page:** https://polyhaven.com/a/portable_generator
- **Source files (all 1k, all downloaded 2026-10-19, MD5s verified against the Poly Haven API):**
  - glTF: https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/portable_generator/portable_generator_1k.gltf (10,130 bytes, md5 `13c2380487daae6726443b9f38dd7e53`)
  - Geometry: https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/portable_generator/portable_generator.bin (939,572 bytes)
  - Base color: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/portable_generator/portable_generator_diff_1k.jpg (755,079 bytes, 1024×1024, md5 `3d572e1716148ca5d641d8a199fe9192`)
  - Normal (OpenGL): https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/portable_generator/portable_generator_nor_gl_1k.jpg (818,829 bytes, 1024×1024, md5 `89a51a982488c21eddec2c6e02249591`)
  - ARM (R=AO, G=roughness, B=metalness): https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/portable_generator/portable_generator_arm_1k.jpg (887,711 bytes, 1024×1024, md5 `7dbb8b9f0aa4e9d3ce6ad37e0326299f`)
  - Specular: https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/portable_generator/portable_generator_spec_1k.jpg (23,119 bytes, 1024×1024 grayscale, md5 `b3044dbc984897ed902bd47a450f742f`)
- **License:** CC0 1.0 — Poly Haven publishes all assets under CC0.
  (https://polyhaven.com/license — "All assets on Poly Haven are CC0.")
- **License link:** https://creativecommons.org/publicdomain/zero/1.0/
- **Author:** Poly Haven contributors (asset listed on Poly Haven; no individual
  author name shown on the asset page).
- **Maps kept (FULL PBR — nothing dropped):** base color + normal (OpenGL) +
  metallicRoughness (ARM: AO in R, roughness in G, metalness in B) +
  specular (`KHR_materials_specular`) + transmission (`KHR_materials_transmission`,
  glass material, factor 1). The GLB embeds all 4 unique 1k JPGs (5 image
  entries; the two diffuse references share one embedded copy to avoid
  duplicating 755 KB). Geometry (bufferViews 0–19) is byte-identical to the
  source `.bin`. Previous diffuse-only repack (1,699,908 bytes, 1 texture,
  normal/ARM/specular dropped) is replaced by this file.
- **Loader note (honest):** the site's Three.js r128 `GLTFLoader` supports
  `KHR_materials_transmission` but NOT `KHR_materials_specular`, so the
  specular map is present in the file but ignored by this loader version —
  base color + normal + ARM still load and shade. No separate
  `occlusionTexture` was added: three.js reads AO from the green channel,
  so pointing it at the ARM map (AO in R) would read roughness as AO.
  AO stays packed in the ARM R channel exactly as Poly Haven authored it.
- **Replaces:** the procedural transformer (tank + fins + conservator + bushings).

### 3. Pylon (VoltWorks chapter — "Pylon")
- **File:** `models/pylon.glb` (145,328 bytes)
- **What it is:** "ElectricPylon_L6" — a real lattice transmission tower (UK-style
  6-arm high-voltage grid tower), 21 m wide × 42 m tall in source, fitted to
  ≤3.2 m tall × ≤1.6 m wide in the scene. Labelled "Pylon" in the 3D caption.
  It REPLACES the procedural pylon (legs + crossarm + peak + insulator discs).
- **Source page:** https://godotengine.org/asset-library/asset/edit/18850
  (Godot Asset Library listing) — code: https://github.com/smalltown2kt/gal-electricpylons
- **Download URL:** https://github.com/smalltown2kt/gal-electricpylons/archive/36b183637a23080e25a8f67447e96e6f71a33714.zip
  (commit 36b1836, 2025-09-22). Model file inside:
  `addons/electric_pylon/meshes/Pylon_L6.fbx` (67,621 bytes).
- **License:** BSD-3-Clause ("New" / "Revised") — permits commercial use +
  modification + redistribution with attribution (copyright notice + disclaimer
  reproduced). Verified in the repo: `LICENSE.md` (Copyright 2025 smalltown2kt)
  and GitHub API `license.spdx_id = BSD-3-Clause`.
- **License link:** https://opensource.org/licenses/BSD-3-Clause
- **Author:** smalltown2kt (Copyright 2025)
- **Attribution (in site footer):** "Pylon (BSD-3-Clause, smalltown2kt —
  lattice transmission tower)". Full copyright + disclaimer reproduced in
  ASSETS.md here (see below) per the license's binary-redistribution clause.
- **Conversion (honest):** FBX → GLB via FBX2glTF 0.9.7 (Facebook) — geometry
  unchanged (584 vertices, 1 mesh). The FBX material had NO texture (Phong,
  baseColorFactor 0.4 gray, metallic 0.4, roughness 0.30). The author's
  Godot material (`addons/electric_pylon/materials/Pylon_L6.tres`) uses
  `textures/Pylon_L6.png` (1024×1024 RGBA, 123,119 bytes) as albedo with
  metallic 0.01, roughness 0.7, alpha-scissor 0.375 — so that exact PNG from
  the same repo was wired in as `baseColorTexture` with `alphaMode: MASK`,
  `alphaCutoff: 0.375`, `doubleSided: true`, metallic 0.01, roughness 0.7.
  The 0.4 gray `baseColorFactor` from the FBX was kept (it multiplies the
  texture, as the author's ~0.43 gray albedo_color does in Godot).
- **Replaces:** the procedural pylon.

### BSD-3-Clause license text (pylon — smalltown2kt, Copyright 2025)
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions are met:
> 1. Redistributions of source code must retain the above copyright notice,
> this list of conditions and the following disclaimer.
> 2. Redistributions in binary form must reproduce the above copyright notice,
> this list of conditions and the following disclaimer in the documentation
> and/or other materials provided with the distribution.
> 3. Neither the name of the copyright holder nor the names of its contributors
> may be used to endorse or promote products derived from this software
> without specific prior written permission.
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
> AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
> IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
> ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
> LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
> CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
> SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
> INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
> CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
> ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
> POSSIBILITY OF SUCH DAMAGE.

## What was NOT found
- **No true CC0 transformer / substation model exists** on the verified sources
  checked: Poly Haven (521 models — no transformer/substation; closest power
  equipment is the portable generator), Kenney (City Kit Industrial is CC0
  factories/warehouses/buildings/tanks — no transformer, substation, or
  electrical equipment; adding a stylised Kenney building would clash with the
  photoreal PBR models, so none was added), Quaternius (characters/robots,
  no industrial equipment), Khronos glTF-Assets (curated samples, no transformer;
  RobotExpressive was dropped from the new repo).
- **Transformer — NOT FOUND via anonymous download.** Sketchfab HAS a CC-BY
  candidate: "Power Transformer Electrical Substation" by AirDigitalca
  (https://sketchfab.com/3d-models/power-transformer-electrical-substation-3148acbe83a14abd8c3bf5c3b4b3f57a,
  license verified via Sketchfab API: CC Attribution, downloadable: true)
  and "Power Transformer" by YodhaGameStudio (CC Attribution, downloadable:
  https://sketchfab.com/3d-models/power-transformer-74fcc717921c47f786f1847108ba11a2).
  BUT Sketchfab's download API returns **401 Unauthorized** without an OAuth
  token — downloads require a signed-in Sketchfab account. This subagent
  cannot sign in (no live-browser / credential flow). **To get it: run a
  browser-task with Darren's Sketchfab sign-in, download the CC-BY GLB, and
  add it with attribution.** Do NOT bypass the login, do NOT use the
  CC-BY-NC "High voltage power transformer" by Showdoze (non-commercial —
  skipped), and do NOT label the generator as a transformer.
- **Switchgear — NOT FOUND via anonymous download.** Sketchfab HAS CC-BY
  candidates: "Electrical Switchgear Cabinet" by armin.wellig
  (https://sketchfab.com/3d-models/electrical-switchgear-cabinet-f3c0feda03f043f79aa32539faa88e17,
  CC Attribution, downloadable: true) and "Electrical Switchgear Panel" by
  the same author (CC Attribution, downloadable:
  https://sketchfab.com/3d-models/electrical-switchgear-panel-1b036514c7e342dfb6058bcd4e3beab1).
  Same blocker: Sketchfab download needs a signed-in account (401 without
  OAuth). The scene's switchgear cubicles therefore remain the existing
  simple procedural cabinets — they are NOT presented as downloaded models.
  Same browser-task route applies if Darren wants them replaced.
- **Pylon — FOUND (this pass):** the BSD-3-Clause Godot pylon above. The
  Sketchfab CC-BY "Pylon" by rhcreations (CC Attribution, downloadable) was
  NOT used — the GitHub/BSD pylon was anonymously downloadable and verified.

## Rendering (fixed 2026-10-19 — was flat / unlit)
- **Renderer:** `ACESFilmicToneMapping`, exposure 1.05, `outputEncoding`
  sRGB, `shadowMap` PCFSoft, `physicallyCorrectLights` true.
- **Lights:** hemisphere (0.6) + key directional (1.25, 2048 shadow map,
  frustum −4.5…4.5 / −3…4, bias −0.0004, normalBias 0.02) + warm fill
  directional (0.5, 0xffe6c4) + cool rim directional (0.6, 0xdfeeff).
- **Environment (IBL):** `THREE.RoomEnvironment` via `PMREMGenerator`
  (`scene.environment`), loaded from the same r128 CDN with fallback.
  If it fails, lights still light the scene — the scene is never unlit.
- **Ground:** one subtle floor per chapter (14 × 8 m plane, roughness 1.0,
  metalness 0, at y = −1.0) + faint grid (opacity 0.25). Ground receives
  shadows; both GLB models sit with their base exactly on y = −1.0.

## Composition (final positions, 1 unit = 1 m, ground y = −1.0)
- **Studio:** Darren stylised figure at (0, base −1.0, 0) · Robot at
  (1.75, −1.0, 0.35), fitted ≤1.7 m tall × ≤1.0 m wide · VoltWorks mini at
  (2.8, −1.0, −1.0) · Patterns mini at (−2.8, −1.0, −1.0). No overlap:
  Darren↔robot centre distance ≈1.8 m; robot↔VoltWorks mini ≈1.7 m.
- **VoltWorks:** pylon — real GLB (BSD-3-Clause lattice tower, fitted ≤3.2 m
  tall × ≤1.6 m wide, group at (−2.6, −1.0, 0)) · Generator at (−0.15, −1.0, 0.1),
  fitted ≤1.0 m tall × ≤1.4 m wide (≈0.99 m tall × 1.40 m wide from true
  0.82 × 0.58 m bounds) · switchgear cubicles at x 1.55 / 2.25 / 2.95,
  z 0 (still simple procedural cabinets — no anonymously-downloadable real
  switchgear found; see "What was NOT found") · scale figure + 1 m bar at (3.35, 1.05), clear of switchgear ·
  bus pylon → generator → switchgear (bus starts at pylon mid-height, y 1.5).
- **Patterns / Verify:** clean procedural diagram (abstract, not physical) —
  4 stations on a ring, unchanged in layout.
- **Camera:** perspective 42°, position (0, 1.9, dist), lookAt (0, 0, 0);
  dist per chapter: Studio 6.0, VoltWorks 6.6, Patterns 6.2, Verify 7.4 —
  framed to see both subjects + ground.

## Loading + fallback
- Models load via Three.js `GLTFLoader` (r128, same CDN fallback pattern as
  Three.js itself). They are lazy: loading starts when the 3D canvas scrolls
  into view.
- **No CSP.** The site has no Content-Security-Policy header/meta, and none
  was added — nothing blocks `GLTFLoader` / CDN scripts.
- If `GLTFLoader` or either GLB fails to load, NO placeholder blocks are
  shown. The failed model group stays hidden, the caption shows a clean
  message ("3D robot/generator model could not load — the rest of the site
  still works. Refresh to retry."), and the rest of the scene keeps working.
- The Patterns chapter stays a clean procedural 3D diagram (abstract diagram,
  not a physical object — per brief).
- Reduced-motion: the robot's idle animation does not play; the scene is static.
- 2D fallback: if WebGL/Three.js fails, the canvas draws a clean 2D diagram.
