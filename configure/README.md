# Paywizard Configure prototype

Entry: `../27.device_manager.html`. Approved first-use composition: A, with the app-download link removed and the existing `WP6170PQ23000060` serial in the footer. It is a static prototype: no real TCI binding, installation or parameter application takes place.

## Interaction

- A fresh browser session starts with an unbound terminal. Enter eight digits, or paste `TC12345678`, then select **Set up terminal**. This validates/binds, installs missing applications, and applies parameter groups.
- Backend-prebound terminals show a static, selectable TCI in a pale sage block (label and value only) and **Set up terminal**. Only a successful first setup exposes the home screen with equal side-by-side **Download apps** / **Update parameters** buttons, package/sliders icons and two-line labels. The home screen does not show old task lists.
- Each entry opens a separate task page. Task pages have no Exit or terminal footer. While work makes progress, return is blocked. After success or explicit failure, **Done** returns home; failures retain **Retry**. After 120 seconds without meaningful progress, **Back to home** appears. Browser Back uses the same completion/stall guard; native shells must route Android Back through it.
- First-setup interruption returns to **Continue setup**; a later maintenance failure retains the dual-entry home and marks the affected entry **Not finished · Continue**. Resuming keeps successful items. Pending app and parameter work are retained separately when the other operation runs.
- Each task has its own phase and progress. Failure exposes Retry in that row and retains successful items. Failed application installation blocks parameter tasks; retry continues the pending setup.
- Exit is a borderless home-only footer action aligned with S/N; there is no This terminal caption. After a stalled return, Exit requires confirmation while work is unresolved. This simulation interrupts local jobs; re-entry checks its stored binding and task records. This is not a guarantee of the real wizarView agent's cancellation/recovery behavior.
- Session storage v3 retains simulated binding, installed versions, first-setup completion and per-operation task records within the tab; unavailable storage falls back to memory. The old v2 demo store is not reused because it lacks a historical setup fact. Completion and tasks are scoped to the simulated binding revision, so reassignment (even to the same TCI) must increment that revision. This is a fixture mechanism, not a proposed backend contract.

Setup and both maintenance buttons provide a pressed scale/color state. Quick taps and keyboard activation retain 140ms feedback before navigation; duplicate activation is guarded. Reduced-motion mode keeps color feedback without scaling.

## Stalled work and return

Returning after a stall is navigation only: the original run keeps its generation, receipts and progress. The original home entry shows **View progress**; other operations stay disabled until that run finishes. Re-entry observes the same run, without repeating manifests or installation. Progress, phase, result or downloaded-byte changes restart the 120-second inactivity clock; duplicate notifications, navigation and polling do not. Resumed progress hides Back to home. No-progress manifest/inventory waits are covered too.

Saved running records without a confirmed outcome remain unknown and block new work. **Check status** rechecks the demo task receipt; unknown, missing, unavailable or mismatched-scope responses never become automatic Retry. Only a confirmed success/failure unlocks new operations. Real integration must replace `taskSnapshot()` with terminal live-job lookup. Explicit exit stops only an owned local simulation; unknown historical tasks stay unknown.

`stalled-setup`, `stalled-apps` and `stalled-parameters` scenarios pause delivery for 180 seconds then resume, allowing manual checks of the 120-second escape. The browser regression uses a virtual clock to exercise these without real waiting.

## Application checks and parameter updates

- **Download apps** fetches the current TCI app manifest and reads the simulated system inventory on every invocation, including continuation/retry. Missing apps are installed; older versions are updated. Same versions show Up to date, newer installed versions are retained. This action never applies parameters.
- **Update parameters** checks whether each configured app is installed. An installed older version is retained: this action does not perform version upgrades. Missing apps must install successfully before any parameter delivery begins. Every new request fetches parameters and applies them again.
- Existing applications show a compact checked row with their actual installed version, without a download progress bar or 100%. Actual install/update work shows phases and progress; updates show installed → target version.
- Failed workflows retain successful items, but continuation rechecks inventory. If an app was removed after an earlier successful parameter application, reinstalling it invalidates that app's parameter receipt and reapplies its group. Old demo receipts without an app association are reapplied conservatively after reinstall. Inventory lookup failure blocks all install/apply work and exposes Retry.
- `installedApplications()` is an explicit **demo** inventory adapter backed by `record.installed`, separate from saved job receipts. Production integration must replace it with current system package inventory and compare Android package versionCode (the prototype compares numeric dotted sample versions). No real device inventory is read by this HTML.

## Review scenarios

Long-press the PAYwizard wordmark or focus it and press **Shift+Enter**. Choose unbound, prebound, setup completed, maintenance failure, lookup failure, application failure, parameter failure, older installed app, uninstalled app, installed-app query failure, or SWAP. Restarting the demo resets only this prototype's simulated records.

Alternatively open `27.device_manager.html?scenario=unbound` (or `bound`, `configured`, `maintenance-failure`, `apps-outdated`, `app-uninstalled`, `inventory-failure`, `query-failure`, `app-failure`, `parameter-failure`, `swap`). A scenario query intentionally resets that scenario on every page load. Remove it to test session restoration across reloads.

Validation samples: `00009999` occupied; `00008888` not assigned to a store; `00007777` unauthorized; `00000000` not found. Other valid eight-digit examples bind in the simulation; these are not real backend existence checks. Query-failure mode deliberately continues failing on retry until another scenario is chosen.

## Files and validation

- `app.css`: selected GO-style presentation and responsive layout, including reduced motion.
- `model.js`: isolated workflow plus an explicit demo adapter; no production endpoints.
- `app.js`: semantic UI, task rows, input normalization, dialogs and event wiring.
- `tests/model.test.cjs`: `node --test configure/tests/model.test.cjs`.
- `tests/browser.cjs`: local headless-browser flow and layout tests. Serve the repo with `python3 -m http.server 8765 --bind 127.0.0.1`; run with a locally installed Playwright package (`PLAYWRIGHT_MODULE=/absolute/path/to/playwright node configure/tests/browser.cjs`). Chromium must be available to that package. The test launches a separate headless browser and only visits the local prototype.

Application labels/versions are preserved illustrative values from the prior prototype. Integration must replace the demo adapter with authenticated S/N lookup, atomic binding, fresh manifests and actual install/apply receipts. Installation success is distinct from parameter application success; terminal SWAP remains a backend operation.
