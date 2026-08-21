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
