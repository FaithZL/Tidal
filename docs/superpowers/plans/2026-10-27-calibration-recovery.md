# Completed calibration recovery implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement the independent model and browser tasks. Preserve all existing work. No commit, push or deployment is authorized.

**Goal:** A single temporary tracking loss after preparation must not erase the learned three poses or force a new three-step sequence.

**Architecture:** The upper-body preparation panel retains calibration templates in memory for the current camera/session, independently of live tracking readiness. CameraActionSource and SessionController keep their existing strict loss, reset, epoch and time guards; the browser rebuilds the input from the retained template after verified new observations and resumes only its own tracking interruption.

**Tech stack:** Existing Three0.186.1, strict TypeScript, Vite, native DOM/CSS, npm lock. No dependencies/assets changes.

## Evidence and contracts

Live UI reports `关节出框 · 3/3 → 0/3`, while inference is15Hz. Model complete is excluded from soft recovery, source clears its active recognizer on loss, browser calls unconditional recalibration. No real image/pose sequence is saved.

- Keep quality .6, freshness300ms, adjacent gap200ms,1200ms/12 observed stable samples. No invalid sample counts, no lost-time filling, no unfinished rep continuation.
- Strict default model/full-body unchanged. Upper panel opts into completed-template retention. Incomplete raised/hold retains existing3s behavior.
- Completed soft failures include confidence/framing/missing/degenerate/gap/stale, plus legal metadata with valid=false (no detected person). Keep step complete and template, make getProfile null, feedback null, ready=false. No3s template expiration.
- On return, collect entirely new stable1200ms/12 samples at the same fixed anchor; template stays byte-equivalent. Further loss resets only this recovery sample window.
- Explicit visibility interruption of completed upper calibration retains template, invalidates live state/cancels auto-start, and preserves visibility pause. It never auto-resumes visibility/user/source-error. Incomplete/full-body visibility remains strict.
- True illegal metadata/order/future/dimensions/anchor, stop/restart, source/mode/session/reset clear template and recovery permission.
- Initial auto-start authorization survives only soft tracking loss; reset its3s cue until fresh recovery. Active/countdown/rest interruption resumes only tracking with fresh epoch/input, preserving all other pauses; rest has its existing camera readiness gate.
- Existing completed-blur E2E cases retain all no-count/no-auto-start/readiness protections; update only the obsolete expectation of deleting learned calibration, with stronger3/3 saved+unavailable assertions. Other old tests unchanged.

## Tasks

- [x] Root backups all existing QA and current source; save real RED failures separately, restore generated historical QA by SHA.
- [x] Model worker owns src/pose/upperBody.ts + new tests/unit/upperBodyCompletedRecovery.test.ts: first RED; explicit retainCompleted option, getSavedProfile(), suspendTracking(reason), snapshot.revalidating and ready; guard all faults; then GREEN old+new.
- [x] Browser worker owns src/browser.ts: preserve source/domain strict contracts; tracking recovery token/reset/cancel ownership, source handoff and setup/countdown/rest/active paths; no input accepting while unavailable. Root owns panel/UI and end-to-end tests.
- [x] Root owns src/ui/upperBodyPreparationPanel.ts + index/css if needed, new tests/e2e/completed-recovery.spec.ts and authored fixture extensions; first reproduce complete+out-of-frame reset. Display saved3/3 and tracking recovery, distinct from preparing first step. Never show ready while unavailable.
- [x] Run complete unit/type/lint and affected E2E (initialstart,countdown,rest,active,carry,manualpauses,soft/hard/stops,legacyfullbody). Build and open normal production with synthetic video/points; inspect desktop/mobile, no errors/external traffic.
- [x] Independent review and fix any actual defects; update PROGRESS with actual commands/exits/limits. Restore historical QA. Keep original5173 running; stop temporary preview. Do not claim physical recognition accuracy from synthetic tests.
