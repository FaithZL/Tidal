# Shoulder seam diagnosis and runtime derivation — 2026-10-22

## Root cause confirmed on the real local CC0 glTF

`Male_Peasant_Arms_1` (brown sleeve) and `Male_Peasant_Body` (tunic/cuff/strap) are separate skinned surfaces. The brown sleeve begins at bind |x|≈0.141, while the tunic's cuff opening is around |x|≈0.28–0.33 and its outer rolled rim around0.35. Their overlapping shoulder surfaces already intersect in the original source bind geometry. CPU triangle-edge/surface inspection found60 unique rest crossings,132 at idle and314 at the raised source chop0s. This is geometry/weight overlap, not a receiveShadow, repainting or polygonOffset fix. Original detailed coordinates are in `shoulder-crossings-before.json`; original actual screenshot evidence remains under `../character-motion/`.

The source skin primitive `Male_Peasant_Arms_2` starts under the brown elbow cuff (bind |x|≈0.445, cuff≈0.50). Simply slimming or replacing the brown sleeve while retaining that covered skin exposes alternating skin/brown strips. This second overlap was reproduced as a separate failing physical-geometry test (`shoulder-skin-red.log`,34 standing crossings).

## Final runtime changes, original asset files unchanged

- Discover source boundaries by welding bind positions at1e-5 only for topology lookup; preserve actual source texture assets and ownership. Both sleeve/cuff sides have18-point garment rings.
- Replace the overlapping brown shoulder roots with a266-vertex/432-triangle loft (source brown primitive818 vertices/1408 triangles). It begins inside the tunic's actual outer rolled rim, copies normalized rim skin weights, and ends at the original brown elbow cuff. Six axial segments,18 circumference segments plus UV seam duplicates. Radial clearance fraction is `0.06*(1-f)+0.30*sin(pi*f)` at axial fractionf. UVs reuse the original sleeve atlas strip; no new painted material, no depth bias, no shadow-hiding claim.
- The already-covered forearm root is fitted to the source brown cuff perimeter: angular interpolation of its actual ring,4% radial inset,3mm distal clearance, matching interpolated skin weights; blend back to the original forearm by bind |x|=.57. Hand/finger geometry beyond that boundary and all skeleton positions/scales/bone lengths remain unchanged.
- Keep the original rigid axe and left gripy=-.30, within its physical shaft. The left two-bone solver blends continuously from the authored elbow pole towards torso-forward+1.2×shoulder-across. The former positive blend cutoff(.001) caused15.45cm/13.51cm elbow pops and was removed. Full blend, exact zero and phase boundaries are tested. Rejected shaft-cone, two-arm tool-centre, sleeve-extension and cap-weight experiments were not retained.
- The final actor owns both original replaced geometry and generated geometry; actor disposal releases each once. Shared world resources/materials retain their existing owner. The isolated sample now directly constructs the new sample head instead of constructing/discarding a whole unrelated NPR character.

## Scope of the physical regression, and the remaining limit

The cap/armhole region is derived from this source model, not fixed face IDs: original sleeve root |x|=.1411465853; inverse-bind upperarm_l origin=(.1919000079,1.4555000857,-.0654000186); inferred shoulder-cap radius=.0507534226. With2mm seam tolerance, tunic triangle bind centroids use |x|≥.1391465853 andy>1.3539932405. This contains the anatomical shoulder/cuff seam. The automated negative control puts the actual original sleeve geometry back into the same posed actor and still detects its shoulder-cap piercing.

`shoulder-seam-region.json/log` independently scans72 actual production-clock samples at0.1s: **zero cap/sleeve crossings, zero skin/sleeve crossings**. Automated tests also explicitly revisit4.15/4.4s and eight source/blend poses. Existing palm contact(<.035m), actual skinned sole, absolute-time determinism, root transform and disposal checks are preserved.

**This is not a claim that the whole character is collision-free.** `shoulder-global-diagnostic.log` and `review-covered-mesh.json` retain global triangle-edge hits between the cross-body upper sleeve and central front chest during3.0–3.9s:10/72 poses, max43 raw edge hits; skin/sleeve remains0. These hit chest source verticesx≈.045–.124 rather than the shoulder cap. Some contacts are externally visible from low/rear rays in diagnostic sampling. The actor has no cloth simulation or full-body collision response. Final visible acceptance therefore also requires the actual final front/quarter/rear/low captures, handled by the parent review. Do not describe this scoped shoulder regression as all-body collision elimination.

## Fresh checks

- Original physical shoulder RED: `shoulder-red.log` (standing132 vs0).
- Covered skin RED: `shoulder-skin-red.log` (standing34 vs0).
- Final scoped shoulder4 + existing character11 + actual motion continuity10 =25/25: `shoulder-green.log`.
- Final complete unit suite296/296 across41 files: `shoulder-full-unit.log`.
- Typecheck/lint pass: `shoulder-typecheck.log`, `shoulder-lint.log`.
- No source glTF/bin/PNG, package/lockfile, domain/input/config or ordinary farm entry changes by this subtask. No Git mutation, purchase, deployment or real-camera/hardware verification.
