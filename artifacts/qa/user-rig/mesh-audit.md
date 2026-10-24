# Supplied character mesh: read-only rigging audit

Date: 2026-10-22. This is actual CPU geometry evidence, not a browser screenshot, final animation approval, or camera validation. Source `public/assets/user-models/character.fbx` is unchanged; SHA256 `de65c08a0c332fa1701e3d2f578f12cdc6d3bf61d19d8514cfda41fa83af1717`.

## Method and coordinates

`node artifacts/qa/user-rig/mesh-audit.mjs` uses the installed Three.js r186 FBXLoader. TextureLoader is stubbed to allocate an empty Texture without image load/network. The script applies **the same current `prepareUserModel` transform**: Y rotation −π/2, uniform scale 2.3693001698597502, height 2.05, shoes/sole points as the horizontal origin, floor Y=0. Face is +Z, up +Y. +X is the character's anatomical left, not a guarantee of symmetry.

The source has 14,700 nonindexed triangle corners, 4,900 triangles and 2,479 welded positions. Welding normalized positions at 1e−6, 1e−5, 1e−4 and 1e−3 produces the **same 10 connected components**. This confirms UV seams do not create artificial major component splits. `mesh-audit.json` contains sorted components and original triangle indices; `normalized-geometry.json` contains actual transformed vertices, triangle indices and UVs. The optional `orthographic-{mesh,color}.png` are CPU triangle projections for anatomical inspection, not WebGL captures. Color projection uses mean original UV color per triangle, therefore it is approximate at seams and does not reproduce lighting.

## Separation and binding feasibility

The **whole axe is independently connected**, component index 1 in `componentRuns[0].groups`, with **230 triangles / 117 welded positions**. Its bounds are X `[0.413111,0.588957]`, Y `[0.092551,1.064334]`, Z `[-0.477369,1.776242]`. It can be removed intact by its triangle indices, retaining source UVs and the exact texture. No triangle cutting, hole filling, material guessing or external mesh tool is required.

The largest component (3,976 triangles / 2,001 positions) contains the continuous body, limbs and head. Remaining components are the diagonal chest/back strap (216 triangles), 3 small leather accessories (108 each), buckle (56), and 3 hair tip fragments (46/28/24). These accessory interpretations come from original albedo plus actual bounds, not metadata names. They should follow the relevant torso/pelvis/head bones rather than be left at world origin.

The original pose is **not T/A pose and not a two handed axe grip**. The torso is bent forward and twisted, knees bent, the right foot (−X) is forward, the left foot (+X) is behind. **Only the left hand (+X) currently holds the axe**; the right hand hangs empty near the forward knee. Their palm centers are about 0.65 apart. A two handed chopping pose needs a genuine new right arm pose, not only moving the whole character or axe.

The right palm/front knee appear close in projection but are not welded together: nearest manually read surface seeds have Euclidean distance **0.2891**, while their shortest surface-edge path is **2.1079**. The right palm→right shoulder surface path is 1.1619; left palm→left shoulder 0.8307. Thus no short hand/knee topology bridge was found. These are localized probes, **not a proof of complete self-intersection freedom**. Spatial weights still need protection against the nearby thigh/hand and torso/arm regions; body mesh is one component.

## Suggested bind landmarks

These are manual anatomical joint estimates from the actual front/side mesh projection and skin-colored source vertices. They are **not detected ground-truth joint centers**. The supplied surface is strongly asymmetric, so do not mirror one side. Parent animator/rig implementer may adjust them after actual deformation review.

| Anchor | X | Y | Z |
|---|---:|---:|---:|
| pelvis | .16 | .93 | −.27 |
| spine | .15 | 1.12 | −.23 |
| chest | .14 | 1.40 | −.13 |
| neck | .12 | 1.56 | .12 |
| head pivot | .08 | 1.76 | .25 |
| left shoulder (+X) | .39 | 1.48 | −.19 |
| left elbow | .54 | 1.25 | −.27 |
| left wrist | .55 | 1.03 | −.05 |
| left palm | .55 | .89 | −.04 |
| right shoulder (−X) | −.12 | 1.40 | −.13 |
| right elbow | −.11 | 1.02 | .04 |
| right wrist | .02 | .70 | .18 |
| right palm | .105 | .56 | .20 |
| left hip | .32 | .86 | −.28 |
| left knee | .48 | .48 | −.20 |
| left ankle | .64 | .19 | −.43 |
| left sole/toe | .67 | .08 | −.40 |
| right hip | .00 | .86 | −.21 |
| right knee | −.13 | .51 | .08 |
| right ankle | −.14 | .16 | −.03 |
| right sole/toe | −.15 | .02 | .09 |

The head's face points forward/down due to the bound pose; straightening the spine without counteracting the neck will leave its gaze down. Check arm deformation at sleeves and shirt/hips when converting to standing; low polygon topology and the original bent cloth can expose creases even with correct bone motion. Finger articulation is not present and is outside these anchor estimates.

## Axe axis and grip

PCA of the handle subset Z<1.3 gives normalized shaft direction `(0.010667, −0.289890, 0.957000)` from butt toward head. The handle butt projects to `(0.479785,1.025035,−0.472051)`, near-head collar is approximately `(0.50,.44,1.68)`. The source left-hand **shaft grip** is approximately `(.486,.895,−.04)`; the palm center is `(.55,.89,−.04)`. The ~6 cm lateral offset is part of source hand/handle contact and must not be lost by parenting the handle straight to the wrist.

Useful blade vertices: low blade corner `(.58433,.09255,1.56338)`, front lower blade `(.56119,.14345,1.70683)`, outer high edge `(.46401,.46738,1.77624)`. The full supplied axe length is approximately 2.30 relative to a 2.05-high character: an unusually long prop. A normal ~0.8 axe assumption will produce a very large sweep or ground crossings. Any intentional axe-only scale change should be explicit rather than silently claimed as original geometry preservation.

## Constraints and next verification

No public files, rig implementation, dependency lockfiles or source video were changed by this audit. No Blender, external service, upload, browser/GPU, model purchase or Git write operation was used. Two loader warnings concern existing unsupported ShininessExponent and ReflectionFactor texture links; geometry parses successfully. The rig/action implementers should verify bind-pose preservation, normalized weights, UV/resource ownership, both hand/handle distances, feet, shoulder seams and an actual continuous standing→windup→strike→return recording. Camera and final naturalness remain separate manual validation.
