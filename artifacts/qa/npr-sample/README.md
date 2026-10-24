# NPR local sample — 2026-10-22

Base `a45116b`; local branch `codex/npr-farm-sample`, no push/merge/deployment. User approved a local sample before expanding the farm. The asset is an original built-in-imagegen texture atlas; screenshots below are actual Three.js game output, not generated concept images.

Actual evidence:

- `baseline.log`: typecheck + original209 unit tests passed.
- `materials/scenery/*-red/green` logs (flat files named with these prefixes): missing modules/contracts, material ownership/shader, local scenery/road clearance and meadow blending RED→GREEN. Actor shape/normal failures were run in agent tool output; final whole suite includes all actor tests.
- `reset-loading-red.log`, `context-loss-red.log`, `atlas-derivative-red.log`: actual failures from review, subsequently fixed. `review.md` records the findings and first interrupted run diagnosis.
- `integration-fixed.log`: six sample E2E passed. Synthetic device error, no physical camera.
- `verify-final.log`: `npm run verify`, exit0;228units/55E2E(7.3m), typecheck/lint/build. `assets-verify.log`: exit0, local model/runtime/license/SVG/NPR atlas checks.
- `delivered-home.png`, `delivered-hero.png`, `delivered-capture.json`, `production-capture.log`: actual production static screenshots, normal5s countdown, manual keyboard zero reps,1366×900/ratio1,0page errors/external requests.
- `showcase.png/json/log`, `capture-showcase.mjs`: production manual home after genuinely clicking the plan-dismiss button, zero reps/no camera,1366×900/ratio1,0errors/external; for reviewing all local sample props without the notification covering the cottage.
- `production-profile.json/log`: default automatic simulation, normal clocks, headlessChromium156/SwiftShader,10s warmup,2323samples/60.0308s,38.70fps,p95 33.4ms,ratio.64→.5,final683×450. **60fps failed.** CPU submission counters are not GPU execution time. Static full-resolution images do not prove dynamic performance.

Reproduce in PowerShell after `npm run build` and `npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`:

```powershell
$env:TIDAL_PREVIEW_URL='http://127.0.0.1:4176/?art=npr-sample'
$env:TIDAL_ART_DIR='artifacts/qa/npr-sample'
$env:TIDAL_ART_LABEL='delivered'
node scripts/capture-art.mjs
$env:TIDAL_PROFILE_OUTPUT='artifacts/qa/npr-sample/production-profile.json'
node scripts/profile-demo.mjs
```

Runtime assets and dependencies are unchanged except the local atlas. Camera accuracy, calibration/PiP with a physical device, hardware GPU, final art quality and approval to expand are `manual_pending`. The55 browser tests include accelerated flows and synthetic camera fixtures, not a new normal142-second production run or real-camera acceptance.
