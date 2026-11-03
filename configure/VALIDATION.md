# Configure verification · 2026-11-02

Scope: `27.device_manager.html` and `configure/`. User approved A first use (06), maintenance home (07) and prebound setup (08), including Q1/Q2 separation and the explicit Q3 choice to stay on the task page while executing. This record supersedes the earlier behavior that exposed independent downloads immediately after binding.

## Implemented

- Initial unbound A screen retains one Set up terminal action and S/N WP6170PQ23000060.
- Backend-prebound TCI is static/selectable with a lock, and only Set up terminal is offered.
- After first setup, home shows Download apps / Update parameters with no previous progress lists.
- Each operation has its own task page. Task pages have no top Back button or S/N footer; browser Back stays on the task while busy, and results remain until the bottom Done/Back to home action. Exit is a door-arrow icon with visible Exit text; busy exit requires confirmation.
- Interrupted/failed first setup offers Continue setup. Failed maintenance retains the dual-entry home with a continuation hint on the affected entry. Successful items survive continuation, including when the other maintenance operation is run in between.
- First-setup completion and per-operation jobs are separately persisted and scoped to the simulated current binding revision. Old v2 demo storage is not reused.

## Checks

| Check | Result |
| --- | --- |
| Model | 18 Node tests passed: TCI validation, query failure, prebound gating, app/parameter phases and retries, historical completion, pending maintenance isolation, interruption before manifest, manifest recovery, binding revision invalidation, duplicate starts and busy return guard. |
| Browser | Independent headless Chromium on localhost: setup, normalization, invalid/occupied input, apps-only operation, Done, reopen, first-setup failure/continue, maintenance failure/continue, persistence across reload, other-task preservation, busy browser Back, busy Exit/cancel/reopen, query retry and keyboard demo dialog. All passed. |
| Layout | Unbound, prebound and configured home at 390×844, 320×568 and desktop 1440×1000. No document/main horizontal overflow. Enlarged controls at 320px remain usable and scrollable. |
| Visual | Inspected actual rendered prebound and maintenance screens, pending-maintenance entry, failed task and enlarged controls against the approved composition. This is local browser review, not physical-device acceptance. |
| Console | No page or console errors in browser suite. |
| Syntax / patch | JS syntax and git diff whitespace checks passed. |

Evidence: `.impeccable/review/reentry/` captures and `browser-results.json`. Screenshot clocks reflect capture time. Application names/versions are preserved examples.

Commands:

- `node --test configure/tests/model.test.cjs`
- `PLAYWRIGHT_MODULE=/Users/beaver/.npm/_npx/b234c773f454f454/node_modules/playwright node configure/tests/browser.cjs`

## Task-page refinement

Removed the top Back button and task-page S/N footer following user screenshot feedback. Targeted Chromium checks passed at 390×844 and 320×568: Done fully reachable after scrolling, busy browser Back still guarded, and S/N restored on return home. No page errors. Captures: `task-no-back-sn-390.png`, `task-no-back-sn-320.png`.

## Parallel maintenance actions

Implemented approved 09-maintenance-parallel.png: equal side-by-side white outlined buttons, package/sliders icons and two-line left-aligned labels. Targeted Chromium checks passed at 390×844, 320×568 and 1440×1000: equal widths and row alignment, no label/main overflow, app-only click navigation, keyboard tab order, enlarged text at 320px and maintenance-failure continuation hint. Actual screenshots reviewed: `parallel-home-390.png`, `parallel-home-320.png`, `parallel-home-1440.png`, `parallel-pending.png`. No page errors.

## Press feedback · 2026-11-03

Setup and both maintenance actions now scale to 96% and change color while pressed. Quick activation holds feedback for 140ms before navigation, with duplicate-trigger protection and generation checks. Targeted Chromium checks verified each pressed color/scale and resulting task navigation, touch tap, keyboard Enter, and reduced-motion color-only behavior. No page errors. Captures: `pressed-setup-button.png`, `pressed-download-app.png`, `pressed-download-parameters.png`.

## Integration boundary

This remains a static simulation using session storage. No backend TCI, real installation/application receipts, wizarView agent, physical terminal or native Android Back integration was validated. In the demo, page exit interrupts jobs and re-entry restores them as retryable; a production adapter must query actual active jobs and restore the executing task page when work is still running. Binding/configuration lookup failure or unknown status must remain blocked rather than being inferred as unbound or configured. A real binding revision/completion source and agent cancellation/recovery contract still need integration.

No deployment or Git commit was performed.
