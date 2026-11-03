# Configure navigation refinement - current review, 2026-11-03

final result: passed

## Scope and evidence

The user's latest screenshots and two confirmed discussion rounds supersede the former footer caption and task-page Exit design. Target: remove This terminal, align S/N and Exit on home, remove the title focus outline, and remove all task-page Exit controls. Done follows explicit completion; Back to home is conditional on 120 seconds without progress.

- Prior visual baseline: `docs/design/configure-go-2026-11-03/implementation-home.png` (780x1688, normalized to 390x844).
- Current captures: `.impeccable/review/configure-navigation/mobile-configured.png`, `mobile-unbound.png`, `small-unbound.png`, `small-configured.png`, `running.png`, and `stalled-setup.png` / `stalled-apps.png` / `stalled-parameters.png`.
- Same-viewport full comparison: `docs/design/configure-go-2026-11-03/navigation-comparison.png`.
- Focused footer comparison: `docs/design/configure-go-2026-11-03/navigation-footer-comparison.png`.
- Mobile capture density 1, CSS/pixel size 390x844; small screen 320x568. Desktop 1440x1000 surrounds the unchanged 390x844 terminal canvas. The baseline is downsampled by 2; no aspect ratio distortion.

## Findings and required fidelity surfaces

No actionable P0/P1/P2 findings remain in this refinement.

- Typography: existing system font, title/action hierarchy and TCI weight retained. S/N stays 16px normally, 14px below 350px, without clipping. Heading remains a programmatic focus destination but no longer receives the browser outline; actual controls retain focus-visible styles.
- Layout: S/N and Exit share one centered footer row. Browser measurements confirmed vertical centers within 1px at three viewport sizes. Both outer edges match the main content. Task pages remove the entire footer, including its divider, leaving room for task details and conditional return.
- Colors: established neutral tokens, bronze Configure, sage bound TCI, and task result colors retained. No new decorative color/elevation.
- Assets: existing icons reused; no new raster replacement or approximation. Exit is absent from running and completed task pages.
- Copy: no This terminal; all explicit results use Done, failed rows retain Retry. Stalled runs show a contextual no-progress message and Back to home. Home original entry shows View progress while conflicting operations are disabled.

## Validation

31/31 model tests and seven browser regression groups passed. Browser console errors: none. Normal setup, failed setup/maintenance, retry, persistence, installed-app policy and lookup errors retain coverage. Virtual time exercises all three stalled flows, including return, home Exit confirmation/cancel, nonduplicating re-entry, recovery hiding Back, and Done. Model tests cover exact thresholds, late outcomes and unknown/mismatched receipts. Browser/syntax/diff checks passed.

## Comparison history and limits

The requested visual changes passed the first batched visual check at normal and small sizes. During behavioral test development, the fake clock had to be installed before app timers and recovery timing had to cover both parallel-item pause endpoints; the final full browser rerun passed. No unresolved visual polish findings.

This is static-prototype evidence, not real terminal installation/cancellation or native Android Back acceptance. `taskSnapshot()` must be replaced by live terminal lookup at integration.

## Implementation checklist

- [x] Home S/N and Exit aligned; caption removed.
- [x] No task Exit/footer or heading focus border.
- [x] Done after success/failure with Retry retained.
- [x] Inactivity return, recovery and guarded home/re-entry.
- [x] Current decisions, tests and evidence documented.

---

## Earlier reviews (historical, superseded where inconsistent)

# Configure bound TCI and footer Exit - 2026-11-03

final result: passed

This verdict covers the requested visual refinement on the captured configured home. Interaction and device coverage limits are listed below; it is not full workflow or physical-device acceptance. Earlier QA below is historical and does not describe the current design.

## Evidence and normalization

- Source visual truth: `docs/design/configure-go-2026-11-03/approved-bound-tci-footer.png` (973 x 1617), the user-approved combined A/C image.
- Browser-rendered capture: `docs/design/configure-go-2026-11-03/implementation-chrome.png` (3420 x 2146), native Chrome screenshot of the running local page.
- Extracted terminal: `docs/design/configure-go-2026-11-03/implementation-home.png` (780 x 1688), 390 x 844 CSS px at 2x density.
- Full comparison: `docs/design/configure-go-2026-11-03/comparison.png`.
- Focused TCI/footer comparison: `docs/design/configure-go-2026-11-03/comparison-details.png`.
- State: configured, TC12345678, both maintenance actions available.
- Normalize both sources to 390px width; remove the implementation's existing 40px status bar for app-content comparison. Preserve aspect ratios. The generated concept has a shorter canvas; existing 390 x 844 terminal runtime, header rhythm and action dimensions are intentionally retained. Compare requested components and alignment, not absolute vertical positions across different heights.

## Findings

No actionable P0/P1/P2 findings in the requested TCI/footer refinement. The static green identity contains only TCI and its value. Exit is borderless and optically centered with This terminal; its text ends on the card/divider right edge. Serial remains on the full-width second row. No visible overflow in the captured home.

## Required fidelity surfaces

- Typography: existing system font and readable terminal sizes retained; TCI value has 650 weight, 23px size. Footer Exit remains subordinate to the two main actions.
- Spacing/layout: 24px shared content edges, 16px identity radius, 14px/16px identity padding. Footer uses a two-column row and full-width serial row with a 44px Exit target. Existing native canvas height explains additional whitespace versus the generated image.
- Colors: sage #e0e8e1 against #f5f6f8 canvas, no input border or decorative shadow; existing neutral and ochre tokens retained.
- Assets: existing app icons reused; bound lock removed. No raster mock is used as interactive UI.
- Copy: TCI, TC12345678, This terminal, Exit, serial and both maintenance labels preserved. No Bound/check/lock remains visible. Accessible group name retains binding semantics.

## Validation and limits

- 26/26 existing model tests passed, including busy exit, interruption recovery and binding invariants.
- JavaScript syntax and diff whitespace checks passed.
- Chrome accessibility snapshot confirmed task-page Exit remained available while terminal metadata was absent.
- Browser test expectation updated for the new footer structure; full browser suite was not rerun.
- In-app browser access host unavailable. Native Chrome showed user activity during attempted interactions, so further UI control stopped to avoid interference. No claim of fresh exit/cancel/reopen interaction, small viewport, or console verification.
- No production integration or physical terminal acceptance.

## Comparison history / checklist

- First scoped visual comparison passed; no follow-up visual edits were required.
- [x] Pale sage identity, label and value only.
- [x] Footer Exit, row center and right edge alignment.
- [x] Same Exit handler, task-page availability, hidden task-page serial.
- [x] Current reference and decision documented.
- [ ] Full browser interaction and small-screen rerun remain unverified this turn.

---

## Historical QA (superseded)

# Paywizard Configuration Design QA

**Evidence**

- Source visual truth: the user-provided TCI and independent-task screenshots, plus `design-qa-assets/device-manager-hierarchy.png` for the established 375 x 812 visual system.
- Browser-rendered implementation: `design-qa-assets/device-manager-section-divider-complete.png`, `design-qa-assets/device-manager-exit-dialog.png`, and `design-qa-assets/device-manager-exit-closed.png`.
- Combined comparisons: `design-qa-assets/device-manager-section-divider-comparison.png` and `design-qa-assets/device-manager-exit-comparison.png`.
- Viewport: implementation frame 375 x 812 CSS px at device scale factor 1; source and implementation captures are both 375 x 812 pixels, so no density normalization was required.
- States: default bound TCI, unbound/conflict, successful parameter download, partial App failure, Retry success, and SWAP-complete startup.

**Full-view comparison evidence**

- The revised page preserves the established Android status bar, Inter typography, light gray terminal canvas, Paywizard blue actions, 18 px content gutters, and compact 375 x 812 density.
- The TCI surface now uses a fixed `TC-` prefix with the 9-digit value aligned as a single identifier. It removes the earlier decorative Tag, edit/reset affordances, and redundant bound-state helper text.
- The terminal SN has moved from the primary content flow to a quiet, persistent footer, so it remains available for device identification without competing with the TCI workflow.
- Download status no longer uses a shared outer card. The workflow heading sits directly on the page and each App or parameter owns its individual bordered surface and semantic state.
- A 1 px neutral divider and 18 px top padding now mark the transition from download actions to dynamic results without introducing another container.
- The initial view and completed parameter state fit within the terminal frame. The frame reports `clientWidth: 375` and `scrollWidth: 375`; browser and phone-frame horizontal overflow checks are both false.

**Focused region comparison evidence**

- TCI region: fixed prefix, numeric-only value, readonly bound state, focus/error styling, and binding helper text were inspected in the full-size 375 px capture.
- Task region: the progress and partial-failure captures verify two standalone task cards, readable names, separate progress bars, phase labels, percentages, and Retry placement without a shared container.
- Separation region: the same-state failure comparison shows that the new divider creates a clear boundary while preserving the established gutters and transparent page background.

**Required fidelity surfaces**

- Fonts and typography: Inter remains consistent with the reference. Heading, identifier, button, task-name, version, and helper-text weights preserve the intended hierarchy without clipping or unintended wrapping.
- Spacing and layout rhythm: existing frame dimensions, gutters, section gaps, button heights, radii, and task-card spacing are preserved. Removing the outer status surface reduces unnecessary nesting while retaining clear grouping.
- Colors and visual tokens: the Paywizard blue, neutral background/borders, readonly gray, success green, and failure red use the existing page tokens and retain clear contrast.
- Image quality and asset fidelity: the screen requires no raster imagery. Functional download, parameter, and Retry icons continue to use Material Symbols Rounded; the TCI field intentionally has no icon.
- Copy and content: visible terminology is consistently `TCI`; `Paywizard APP`, `Paywizard APP Parameters`, `Paywizard TSYS`, and `Paywizard TSYS Parameters` appear in their correct workflows.

**Interaction checks**

- Startup binding query resolves to readonly `TC-000001234`; reload restores this default without displaying a bound-state message.
- Long-press behavior is implemented on the title, with `Shift+Enter` as the keyboard-accessible developer-menu shortcut.
- Demo states return bound, unbound, and SWAP-complete bindings; SWAP resolves silently to readonly `TC-000004321`.
- Unbound input strips non-digits and limits entry to 9 digits. Empty/short values do not start a workflow.
- `TC-000009999` reports that the TCI is already bound to another terminal and remains editable.
- An available TCI binds atomically on the first download action, becomes readonly immediately, and stays bound after success or failure.
- App tasks run independently for approximately 16 and 18 seconds; parameter tasks run independently for approximately 9 and 10 seconds.
- `TC-000000000` completes the Paywizard task and fails the Paywizard TSYS task for both workflows. Retry preserves the completed row and reruns only the failed row.
- `Update Parameters` appears only after both parameter rows reach `Applied` at 100%.
- Rapid starts are guarded by disabled controls and the internal running flag. Browser warning/error log is empty.
- The header exit control opens a keyboard-accessible confirmation dialog; Cancel restores focus and allows an active download to continue.
- Confirming Exit cancels the active run token and shows the prototype-safe closed state. `Open App` reruns the startup binding query and restores the initial screen.

**Findings**

- No actionable P0, P1, or P2 findings remain.

**Comparison history**

- P2 resolved: the previous full-value input required operators to enter the product prefix and used an unsuitable configuration icon. The new field fixes the prefix as `TC-`, accepts digits only, and removes the icon.
- P1 resolved: the previous page allowed a locally locked TCI to be edited through a confirmation dialog. All edit/reset UI has been removed; binding now comes exclusively from the simulated SN lookup or one-time unbound claim.
- P2 resolved: application and parameter simulations completed too quickly and used `OPC` terminology. Timings now represent multi-stage downloads, and all visible names use `Paywizard APP`.
- P2 resolved: the SN and `Bound to this terminal` copy competed with the main configuration task. The bound helper is now absent and the SN is presented as low-priority footer metadata.
- P2 resolved: the 9 px footer SN was difficult to read and the shared status card added unnecessary containment. The SN now uses 11 px/700 text, while task cards are independently placed on the page.
- P2 resolved: after removing the shared status card, the action and result regions visually ran together. A `--line` divider and 18 px spacing now provide hierarchy without restoring nested surfaces.
- P2 resolved: the app had no explicit exit path. A restrained header action, destructive confirmation, active-download warning, and testable closed state now complete the terminal workflow.

**Implementation checklist**

- [x] SN-based startup binding and silent SWAP state.
- [x] Fixed-prefix numeric TCI input and conflict validation.
- [x] Immutable bound state with no edit/reset affordance.
- [x] Independent realistic App and parameter workflows.
- [x] Partial failure and failed-item-only Retry.
- [x] 375 x 812 overflow, visual, keyboard, and console checks.
- [x] Bottom SN placement remains visible during active workflows without reducing horizontal space.
- [x] App and parameter task cards render independently without an outer border, fill, radius, or shadow.
- [x] Result divider is hidden initially and visible for App and parameter running, success, and failure states.
- [x] Exit, Cancel, active-download warning, closed state, and reopen flow are keyboard accessible and visually consistent.

final result: passed
