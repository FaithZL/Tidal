# Supplied hand geometry and local grip corrective

This work uses the actual supplied FBX and existing derived mesh. No replacement hand, hidden overlay, added finger geometry, new GPU resource, original-FBX rewrite, UV change, upload or external model service was used. It remains a local character sample, not full-farm integration or camera validation.

## Actual source shape

The original left hand holds the source axe; the right hand is an empty curled fist beside the front knee. Source hand selection contains approximately 220 welded positions each, including four curled finger-pad silhouettes and a thumb. Fingers are part of the continuous body surface, **not separate finger meshes or original finger bones**. There is enough shape for a source-specific local grip corrective, but it does not provide clean anatomy for a claimed high-detail three-joint rig per digit.

`{left,right}-source-projections.png` and `grip-sections.png` are CPU triangle projections/intersections from the unchanged mesh and original UV colors. They are diagnostic figures, **not browser screenshots**. Some finger/handle-contact faces already carry brown wood-colored baked pixels in the original texture. This remains visible in close-ups; it is not evidence that a new hand was painted or a different material was attached.

The old palm markers were surface/rough palm-center anchors, not grasp-cylinder centers. The adapter exposes virtual grip centers in each hand bone's local bind basis, based on these normalized-source coordinates:

- Left: `(.468,.900,−.040)`, opening-side refinement from the initial measured `(.485,.900,−.040)` to avoid the original folded cap crossing the old axis.
- Right: `(.056,.578,.170)`.
- Source grasp axis: left `(.010667,−.289890,.957000)`, right approximately `+Z`. `frames` maps local `+Y` onto each of these source-space axes.

Actual source-axe triangle/plane intersections give displayed radii (constant source scale ×.62): lower shaft `.16` reaches **.031489**, old lower `.20` reaches **.031498**, upper `.55` reaches **.031578**. The changed lower marker is therefore covered by the same surface-clearance checks.

## Implementation and real RED/GREEN

Owned product files are `src/game/world/userHandGrip.ts` and `tests/unit/userHandGrip.test.ts`. The parent integrates its centers/frames/pressure in Motion; rig and motion remain owned by their respective implementers.

The adapter keeps the 17 main bones and applies a source-specific corrective to original hand vertices. A bounded setup-only contact solve moves real finger/thumbnail surfaces around a finite shaft cylinder, with a **4.2 cm maximum setup displacement**. Contact is applied to a whole pad face together, and a local area/original-facing constraint prevents this small corrective from collapsing or folding caps backwards. This latter check is a local guard for this corrective, **not a universal proof that a face turning >90° during animation is a topology inversion**.

Two pressure endpoints are precomputed once; `apply(.85…1)` deterministically interpolates existing position/normal attributes. No per-frame geometry or face-normal rebuild occurs. Only the hand and its immediate shared hand corners receive recomputed welded normals; original face/clothing/other body normals remain byte-identical. `restore` restores original derived position and normal values exactly; source FBX geometry/UV/material ownership remain unchanged.

Actual logs:

- `hand-red.log`: 3 failures / 1 pass on no-op adapter: real triangle clearance 0, no corrected vertices, no pressure behavior.
- `hand-first.log`, `hand-second.log`: real left-cap overlap remained despite initial radial pushes; no clearance assertion was reduced.
- `hand-center.log`, `hand-green.log`: opening-side center refinement gave raw triangle clearance pass across pressure `.85/.88/.95/1`, fixed original triangle sets.
- `hand-integrated-first.log`: seven actual skinned poses passed, rather than only bind points or hand markers.
- `hand-flip-red.log`: the first contact solve could fold a real small finger cap backwards; whole-pad contact and local area/facing protection fixed it.
- `hand-orientation-first.log`: **6/6 hand tests pass** with all earlier clearance/source/resource/normal constraints retained.
- `hand-typecheck-final.log`, `hand-lint-final.log`: exit 0.
- `hand-unit-all.log`: intermediate full suite **365/366**; one existing shoulder regression failed at 2.075× under the parent's changed motion. The rig owner subsequently corrected it independently; this agent does not relabel that intermediate command as green. Final unified verification belongs to the parent.

## Actual final CPU surface measurements

`final-hand-surface-statistics.json` uses a fixed source set of **431 left / 439 right triangles**, exact finite-cylinder slab clipping, and actual skinned world positions for seven integrated poses. At pressure .95, bind clearances are **.03504 / .03504**. Minimum sampled posed clearance is **.032987 left / .034560 right**, both beyond the actual displayed shaft's .03158 maximum radius. The unit checks retain the requested allowance of no more than 1.5 mm potential skin blending error; the sampled final result is better than that allowance.

Final setup displacement is at most **3.98 cm left / 4.06 cm right**. Minimum finger-face area ratio versus source is **.304 left / .284 right**; minimum local face-normal dot versus source is **.132 / .145** after the final bounded solve. These measurements characterize this source-specific corrective; they do not establish complete collision freedom between fingers, cuffs, tool, torso and scenery.

Actual parent screenshots `second-render/{raised-grip,clear-grip,grip-side}.png` were inspected. They preserve the recognizable original curled fingers and improve shaft placement, while the original brown contact-texture patches and angular low-poly finger pads remain visible. The first solve's local cap fold was subsequently fixed by the final area/facing constraint; the parent must inspect a fresh frozen-source render before claiming its final visible result. No additional retopology, sculpting, texture repaint or full anatomical finger rig is claimed.
