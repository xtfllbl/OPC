# Design QA — Semantic Payment Cards

- Visual target: user-provided payment-method screenshot
- Implementation: `10.cash_discount.html`
- Browser screenshot: `design-qa-assets/payment-type-style-cards.png`
- Large-value screenshot: `design-qa-assets/payment-type-style-cards-large.png`
- View state: Cash `$15.00`; Card `$15.60`

## Fidelity check

- Cash uses the target’s pale-green surface and green outline.
- Card uses the target’s pale-blue surface and blue outline.
- Payment icons are removed to reduce component noise.
- CASH and CARD use the same uppercase, tracked-title, short-underline language as transaction types.
- The payment title and amount share one centered axis.
- Amounts remain uniform deep blue-grey so the semantic title and the monetary value have distinct roles.
- Currency symbol, integer, decimal point, and cents share one size, weight, and baseline.
- Existing merchant identity, divider position, calculations, and workflow navigation remain unchanged.

## Interaction state

The default cards use the target appearance. On press, the selected card:

- deepens its semantic surface;
- strengthens its semantic border with a subtle inner ring;
- changes the amount to the selected payment color;
- uses the existing short press-scale transition before navigation.

## Verification

- Default Cash and Card states render correctly.
- Large values `$14,145,000.00` and `$14,710,800.00` remain complete and centered.
- Card selection with `$104.00` correctly follows the project’s amount-ending-in-4 failure rule and reaches `6_receipt_failed.html`.
- Inline JavaScript parsing and `git diff --check` passed.

No P0, P1, or P2 visual issues remain.

final result: passed
