# Design QA — Payment Method Option 2

- Source visual truth: `/Users/beaver/.codex/generated_images/019f649e-2b79-7421-a52c-5ca7ed018ef8/call_mqaglWTNrA6yVSYj2kQojKWI.png`
- Implementation: `10.cash_discount.html`
- Implementation screenshot: `design-qa-assets/payment-option2-implementation-v2.png`
- Combined comparison: `design-qa-assets/payment-option2-comparison-v2.png`
- Viewport: 375 × 812
- State: Cash `$14,145.00`; Card `$14,710.80`; default merchant fallback

## Full-view comparison evidence

The combined comparison places the selected generated direction and the browser-rendered implementation side by side at the same 375 × 812 viewport. The implementation intentionally preserves the existing product header, merchant-context system, logo sizing, and established divider position rather than copying the generated BrightMart placeholder. Below the divider, both versions use two independent pale-green/pale-blue tap cards with a colored leading edge, a compact icon-and-method identity row, and a large uniform amount below it.

## Focused region comparison evidence

The payment-card region is readable in the full comparison without further cropping. Cash and Card use the existing Material Symbols Rounded assets, semantic green/blue tokens, uniform monetary typography, matched left alignment, and no nested white icon tiles. Currency symbol, integer, decimal point, and cents share one size, weight, and baseline.

## Findings

No actionable P0, P1, or P2 issues remain.

- P3: The generated reference uses a slightly softer, image-generated surface treatment. The implementation keeps the project’s flat semantic surfaces and existing border/shadow tokens for consistency with the rest of the POS flow.

## Required fidelity surfaces

- Fonts and typography: Inter is retained. Payment names use 22 px/800; standard amounts use a uniform 42 px/800 treatment. Compact and tight tiers scale the entire value together without splitting currency or decimals.
- Spacing and layout rhythm: The two cards keep the existing terminal divider and card heights. Each card uses a centered two-row content group with a 12 px row gap and aligned left edge.
- Colors and visual tokens: Cash uses the existing `--cash`, `--cash-light`, and `--cash-border` tokens; Card uses `--primary`, `--primary-light`, and the established blue border.
- Image quality and assets: Existing merchant assets are preserved. Cash/Card controls use the already-loaded Material Symbols Rounded icon library; no replacement drawings or placeholder assets were added.
- Copy and content: `SELECT PAYMENT METHOD`, `Cash`, `Card`, and both full amounts match the required workflow. No promotional, savings, card-network, or explanatory copy was introduced.

## Primary interactions tested

- Card selection was clicked at the browser-rendered large-amount state.
- Navigation reached `6_receipt.html` with the correct card amount, payment method, transaction type, currency, and merchant context.
- Browser console warnings/errors: none.
- Static JavaScript parsing and `git diff --check`: passed.

## Comparison history

- Iteration 1: Structure matched the selected direction, but the amount was visually too small and the gap between identity and amount was too loose.
- Fix: increased the standard amount from 38 px to 42 px, reduced the row gap from 20 px to 12 px, and centered the two-row group inside each card.
- Iteration 2: the combined comparison shows the intended amount-first hierarchy with complete values and consistent project styling. No P0/P1/P2 findings remain.

final result: passed
