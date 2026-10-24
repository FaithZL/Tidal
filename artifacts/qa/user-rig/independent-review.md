# Independent CPU rig / motion review

Reviewed 2026-10-22, read-only product source. Evidence: `review-weights-before-fix.json`; it records SHA256 of the exact three TypeScript files inspected. `review-runtime.mjs` makes QA-only transpiled snapshots, parses the real FBX with empty local Texture objects and samples the actual SkinnedMesh without a browser, GPU, upload or dependency installation.

## Final follow-up: cross-limb issue resolved; localized elbow deformation remains

After the implementer replaced Euclidean-only propagation with surface-edge Dijkstra seeds, constrained chest seeds, and isolated the measured neck/head opening, this reviewer reran the **entire actual mesh edge diagnostic** at nine phases. Final rig source SHA256: `ec8e0ea1149b133ab4d2cf37d77a21e008077e599b7aa9458c03041593d75d9b`; final motion SHA256: `67fad0487624a5790a211c6a528787e137308953e3c5778e7dce6405636d4e19`. Evidence: `review-weights-after-fix.json` and `review-runtime.log`.

The three original bad edge pairs now remain between **0.976× and 1.123×** rest length across all nine sampled phases. Their weights now match source anatomy: 706/707 are **93.4–99.3% rightThigh** with small shin transition and no arm; 1842/1844 and 1927/1928 are **99.1–99.9% rightHand** with small forearm transition and no thigh. Thus the reported 7–10.8× cross-limb tearing is resolved on the actual mesh, beyond merely placing palm markers correctly.

Broader diagnostic improvement: standing edges longer than 1 cm with stretch >2× fell **156→28**, >3× **70→2**; raised t=3.4 fell **254→18**, >3× **118→0**. The before and after versions also include the parent's documented grip/shaft-roll motion adjustments, so these totals are comparative integration evidence, **not an isolated weight-only experiment**. The limb-membership correction above is independently evidenced by actual final weights.

Residual maximum is **3.2807×** at t=4.15 on the left inner elbow: rest `(.510289,1.235553,−.097911)`→`(.510289,1.254063,−.107166)`, a 2.07 cm edge becomes ~6.79 cm. Standing maximum is **3.0747×** on the right inner elbow: rest `(.001260,.893115,.045543)`→`(.019770,.883860,.040915)`, about 2.12 cm→6.53 cm. These are transitions among the **same arm chain**, not former hand/thigh contamination. Smaller right-wrist and left-shoulder transitions remain. No >2× head/neck edge was found in this final sampled diagnostic. The actual visibility of the remaining elbow compression/stretch must be judged in the parent's real close-up render; this audit does not claim naturalness or collision freedom from edge lengths alone.

The parent also reproduced and corrected uniform root/ancestor scaling in the IK (`motion-scale-{red,green}.log`, 14/14 motion tests as reported by parent). Read-through confirms limb lengths are now measured in world space and the palm offset includes root world scale. This removes the earlier uniform-scale limitation; nonuniform/sheared skeleton transforms are outside the current sample's use.

## Initial finding (resolved): nearby arm / leg weights caused extreme mesh stretching

The initial capsule classifier permits nonadjacent bones as first/second influences. Four topology smoothing passes preserve a wrong classification already seeded on the nearby palm/thigh surfaces. This occurs on the actual supplied character, even though both palm markers reach their tool grip markers accurately.

For example, body corner 1927 at rest `(0.056790,.550677,.087191)` has **rightHand .62112 / rightThigh .36137**, while its neighbor 1928 at `(.075300,.559932,.087191)` has **rightHand .76846 / rightThigh .20230**. That 2.07 cm edge stretches about **7.32×** in standing. Corners 706/707 on the nearby thigh at `(-.095919,.606208,.207507)` / `(-.095919,.647856,.212134)` interpolate between rightThigh and rightForeArm; the 4.19 cm edge reaches roughly **30 cm** in standing. The current raised pose snapshot also stretches a 1.39 cm edge near the palm/inner thigh by **10.80×**.

This is an actionable skin-weight bug, not merely a taste issue. A palm-marker contact test does not cover the actual fingers, sleeve or thigh surface. Recommendation: establish limb membership using topology/geodesic distance to high-confidence anatomical seeds, then limit transition smoothing to the connected arm or leg chain. Add a regression on these actual rest-coordinate patches that checks an isolated right arm rotation does not drag the thigh, and an isolated thigh rotation does not distort the palm. Do not solve it by increasing global smoothing iterations or dropping the surface checks.

The evidence also flags smaller 2–3× edge stretches around elbows, armpits and collar/shoulder. Those need visual review after fixing the gross cross-limb classification; threshold alone is not proof of a visible seam or bad art.

## IK and ownership checks

The current two-bone solver uses world start/target/pole coordinates and derives local rotations through the current parent world quaternion. With the current unit-scale rig/root, its upper/middle aim sequence is coherent. Tool delta (`currentToolRotation × bindToolRotation⁻¹`) correctly carries bind hand orientation into the new grip basis. This review's nine sampled phases found both palm marker contacts at numerical precision, independent of the surface weight problem.

The initial solver used local bone lengths while targets were world coordinates. This was raised as a boundary limitation and subsequently fixed for uniform root/ancestor scale; see the final follow-up above. Nonuniform/sheared transforms are outside the current sample's use.

Derived body/axe geometries and Skeleton are released explicitly, while materials/textures remain shared with the imported model's owning dispose path. The constructor/caller still must dispose the model if creating the derived rig throws. The current sample failure path has the model in its models map before rig creation and releases it. No additional actionable resource leak was found by this focused read-through.

No domain, camera, mock preferences or complete game input paths are changed by these classes. Actual browser continuity, skin appearance, finger contact and final motion naturalness remain separate verification.
