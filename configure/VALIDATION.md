# Configure verification · 2026-11-02

Scope: `27.Paywizard_config.html` and `configure/`. User approved A first use (06), maintenance home (07) and prebound setup (08), including Q1/Q2 separation and the explicit Q3 choice to stay on the task page while executing. This record supersedes the earlier behavior that exposed independent downloads immediately after binding.

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

## Separate app-update and parameter workflows · 2026-11-03

User clarified that Download apps must compare current installed versions and repair missing apps, while Update parameters only requires configured apps to be present before applying parameters again. Implemented independent simulated inventory reads on every start/continuation/retry, numeric dotted-version comparison for demo updates, no downgrade of newer installed versions, presence-only checks for parameter updates, and fail-closed inventory queries. Reinstall invalidates affected parameter receipts on continuation. Successful checks are compact rows without fictional download progress; actual delivery retains phases and percentages.

Validation: **26 model tests passed**, covering old/new/same versions, external uninstall after successful work, missing-app repair before parameters, failure gating/retry, inventory failure, fresh targets on continuation and per-app parameter invalidation. Full localhost Chromium suite passed, including the new older-version and uninstalled-app scenarios for both buttons and inventory failure. No page/console errors. Captures reviewed: `apps-outdated-download-app.png`, `apps-outdated-download-parameters.png`, `app-uninstalled-download-parameters.png` under `.impeccable/review/reentry/`. Syntax and whitespace checks passed.

These checks exercise demo inventory, not a physical system package manager. Production must supply fresh installed package/versionCode data and real install/apply receipts.

## Integration boundary

This remains a static simulation using session storage. No backend TCI, real installation/application receipts, wizarView agent, physical terminal or native Android Back integration was validated. In the demo, page exit interrupts jobs and re-entry restores them as retryable; a production adapter must query actual active jobs and restore the executing task page when work is still running. Binding/configuration lookup failure or unknown status must remain blocked rather than being inferred as unbound or configured. A real binding revision/completion source and agent cancellation/recovery contract still need integration.

No deployment or Git commit was performed.

## 2026-11-03 - Bound TCI and footer Exit

Implemented the approved combined image. Bound TCI is a static sage block without icons or status text; unbound input is unchanged. Footer Exit shares the metadata row and remains available on task pages while caption/S/N are hidden. Existing browser test expectation now checks hidden serial and visible Exit.

Validation this turn: 26/26 existing model tests; app.js and browser.cjs syntax; git diff whitespace checks. Chrome native screenshot verifies the configured home at 390 x 844 CSS px / 2x capture. An accessibility snapshot also showed task-page Exit with identity metadata absent. In-app browser was unavailable; native interaction checks stopped when Chrome reported user activity. The browser suite, small-screen checks, console check, and full exit/cancel/reopen interaction were NOT rerun this turn. Prior test results are historical only. No physical terminal integration or visual acceptance is claimed.

## 2026-11-03 - Approved task navigation implementation

This run supersedes the preceding footer/interaction limitations for the current code. Home now has aligned S/N and Exit without a caption. Task pages have no Exit/footer, heading focus has no visible outline, success and explicit failure expose Done, and only 120 seconds without meaningful progress exposes Back to home. Return leaves the original workflow active; View progress reopens it, competing actions remain disabled, and home Exit warns while work is unresolved. Unknown saved runs remain blocked until a matching result is confirmed.

- `node --test configure/tests/model.test.cjs`: 31/31 passed. Added coverage for all three workflows, pre-progress manifest waits, exact 120-second boundary, duplicate reports, byte/phase/result updates, late completion on home, stale return clicks and unknown task receipts.
- Existing browser regression: 7 groups passed; console errors empty. Viewports 390x844, 320x568 and 1440x1000; enlarged-text layout included. Home S/N and Exit vertical centers differ by less than 1px. Task heading computed outline is none.
- Browser virtual-clock scenarios verify stalled setup/apps/parameters, return without cancellation, original-entry View progress, disabled competing operation, home Exit confirmation/cancel, re-entry, recovered progress hiding Back, and Done returning home. Fake clock is installed before application timers; recovery advances beyond both parallel items' pause endpoints.
- Screenshot evidence and JSON results: `.impeccable/review/configure-navigation/`. Browser suite launches its own headless Chromium and does not control the user's Chrome session.
- Syntax and `git diff --check` passed. Real terminal job lookup/abort and native Android Back wiring remain integration work; the HTML adapter is simulated.
