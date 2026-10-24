# Local NPR sample review

Independent read-only review found 0 Critical, 2 Important and 1 Minor. All three were addressed before the final complete verification run.

- Reset while the atlas was pending could trigger delayed autoplay. The actual failing browser test is in `reset-loading-red.log`; the page's initial session ID now cancels deferred autoplay after reset. Targeted GREEN: `reset-loading-green.log`.
- A late atlas load could re-enable controls after context loss and reset cleared transient error text. Actual failing browser test: `context-loss-red.log`. `renderFailed` now latches fatal renderer failure independently of text; covered in `integration-fixed.log`.
- `fract()` before implicit atlas mip selection produced discontinuous derivatives. Shader regression first failed (`atlas-derivative-red.log`); explicit `textureGrad` uses unwrapped UV derivatives (`atlas-derivative-green.log`). The real browser sample test also checks shader console errors.

`integration-fixed.log`: six sample browser tests passed, including loaded/delayed/missing atlas, reset, context loss, explicit real-camera failure without simulation fallback, pause, rotation, inventory and simulated settlement/reset. Device failure is injected, not a real-camera test.

The first full run was interrupted after a hidden setup switch timeout. Trace shows the initial failure was a module request (`autoDemoSource.ts`, `net::ERR_NO_BUFFER_SPACE`) at 22.903s; before the accept click the app was still static HTML, with empty world and no phase. A later source edit produced a confirmed Vite full reload around82.22s and detached the element. The upstream cause of the buffer error is unknown; this is neither a passing run nor proof of a production logic regression. Its log, error context and trace are retained separately. Final verification starts after all application edits stop.
