# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Scope

This record covers the Paywizard Agent / Configure design study for `27.device_manager.html`, a web prototype of a terminal application. It does not redefine other OPC payment screens.

## Users

People setting up a terminal, downloading its assigned applications and parameters, or maintaining that configuration.

## Product Purpose

Make a terminal usable with minimal decisions: identify its TCI, install required applications, and apply its parameters. The user confirmed `Set up terminal` as the primary first-use action on 2026-11-02.

## Operating Context

On entry, query the current binding by terminal S/N. An existing TCI is read-only. Only a successful unbound response permits entry of a new TCI. Binding-query failure must offer retry, not an editable unbound form.

## Capabilities and Constraints

- TCI is `TC` followed by exactly eight digits. Normalize full-value paste and numeric entry.
- Binding requires an existing, authorized, store-assigned, unoccupied TCI; backend binding must be atomic. Terminal cannot perform SWAP or take another terminal's binding.
- `Set up terminal` composes binding, required application installation, and parameter application. Preserve independent application and parameter operations.
- Applications and parameter groups show individual phases, progress, and outcomes. No aggregate progress or completed badge.
- Failed application installation blocks parameter tasks. Retry only failed items and automatically continue the pending parameter operation.
- An installation receipt and an applied-parameter receipt are distinct. Download completion is not execution success.
- Parameter update fetches a fresh manifest. Expose `Update parameters` on the maintenance home after first setup has completed for the current binding; a later failed update does not erase that historical completion.
- Confirm interruption risk on exit during execution; re-entry queries binding and actual task state. Agent cancellation and recovery contracts remain unresolved.

## Brand Commitments

Use Paywizard GO as the visual reference. The requested experience is simple, fresh, and immediately understandable. Current GO evidence uses system typography, near-black controls, light neutral surfaces, restrained borders, and sparse supporting copy. The latest user decision restores concept A's original layout and removes only the Download apps only entry. S/N returns to A's bottom footer, not below the TCI input; no surrounding form card. This supersedes both the grouped-card and inline-S/N intermediate directions. Set up terminal is the sole first-use action, including backend-prebound terminals. Hide independent maintenance entries until first setup completes. The approved re-entry home uses readonly TCI and equal Download apps / Update parameters entries; the task page stays open during execution, with an explicit Done after it ends. Exit uses a door-arrow icon and visible label. Preserve unfinished first setup separately from subsequent maintenance failures. Use the existing prototype serial WP6170PQ23000060 for design examples; do not invent a different serial convention. Approved references: docs/design/configure-go-2026-11-02/06-a-original-single-action.png, 07-maintenance-home.png, 08-prebound-setup.png and the approved side-by-side maintenance actions in 09-maintenance-parallel.png.

## Evidence on Hand

- Feishu requirement revision 47, section 2: https://wizarpos.feishu.cn/docx/SLONdzLpXoRIgAx6k1tclZGMnEc
- Existing local prototype: `27.device_manager.html`.
- GO `app/lib/core/ui/theme.dart`, `design-qa.md`, and 2026-10-31 native account/login captures in `/Users/beaver/Paywizard/代码/paywizard/Paywizard-GO`.
- Application names, versions, TCI and S/N in concepts are illustrative, not live terminal evidence.

## Product Principles

- One obvious primary action for first use.
- Reveal operational detail when it becomes useful.
- Keep successful results when another item fails.
- Show truth from the terminal and backend rather than inferred completion.

## Open Decisions

The user approved the final A reference and authorized implementation. The existing HTML entry now implements that design with an explicit simulated adapter. Real terminal dimensions and agent interruption/recovery behavior remain to be settled through integration; local browser checks do not establish physical-device acceptance.
