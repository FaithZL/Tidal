# Local refinement and motion review

Scope: continue the existing local NPR sample only. Preserve previous uncommitted sample work, domain/input/config, camera/simulation preferences and all behavioral negatives.

Independent read-only static review:0Critical/0Important/1Minor. Actual Three ray probes found24 grass roots buried more than3cm in the authored banks; two clumps were fully buried. `meadow-bank-red.log` reproduces; construction now samples only the two bank surfaces and reuses those heights for herbs/flowers/stones. `meadow-bank-green.log` and later fine-scale tests pass. No per-frame terrain rays.

Independent read-only motion review:0Critical/1Important. Reset emitted its effect before subscription; the effect handler replaced the snapshot, making subscriber session-ID detection ineffective. The reviewer's actual controller-order probe reported zero snaps. `motion-reset-red.log` is the real browser failure. Reset now explicitly snaps actors inside the session-reset effect after choreography synchronization/application. `integration-final.log` contains the passing first-frame rendered-hand regression, pause compositor-pixel freeze and no duplicate-credit checks.

First sample integration:8pass/1fail (`integration-first.log`). The new motion test resumed with focus still on the pause button, so Space was correctly ignored by existing control-focus protection. The test now explicitly focuses the action button; production keyboard/recognition thresholds were not changed. Targeted final sample run:10/10pass (`integration-final.log`).

Source review also checked: finite observed-delta clock; zero/invalid/>100ms freeze; revision changes rendering the final interpolation frame; actual two-hand center used before rebuilding held-log positions; per-actor deformation geometry; shared cutout map/alpha/depth/shadow path; two-asset readiness and world ownership. No claim of physical-camera accuracy, hardware GPU performance, or final art acceptance follows from source/tests.
