# Design QA

- Source visual truth: latest user-provided Dejavoo Customer Copy reference plus the established Sale/Tip/Cash screens in the current conversation (no local attachment path exposed)
- Implementation: `6_receipt.html`
- Implementation screenshot: unavailable because no in-app Browser or Chrome surface is available in this session
- Intended viewport: 375 x 812
- State: approved Sale with Merchant Copy printed and Customer Copy options

**Full-view comparison evidence**

Blocked. The source references are visible in the conversation, but a browser-rendered implementation screenshot could not be captured, so the required combined visual comparison could not be produced.

**Focused region comparison evidence**

Blocked for the same reason. The intended focus regions are the UNIQLO/payment-approved hierarchy, total amount, Merchant Copy status, Customer Copy option cards, and inline Email form.

**Findings**

- [P1] Browser-rendered visual verification unavailable
  - Location: full Customer Copy choice and Email-entry states.
  - Evidence: both available browser surfaces reported unavailable, leaving no implementation screenshot or computed-layout evidence.
  - Impact: spacing, clipping, font loading, icon rendering, and overlay/nav stacking cannot be signed off visually.
  - Fix: open the local preview in an available browser surface, capture the 375 x 812 Sale view plus Transactions and Settings states, then compare against the supplied references.

**Static verification completed**

- HTML parser completed without structural exceptions.
- JavaScript parsed successfully.
- CSS brace audit passed.
- DOM assertions confirmed one sourced UNIQLO merchant logo, a centered Enter Amount divider with lines on both sides, a fixed 14-key keypad, three icon-only bottom-navigation items, no Transactions title header, and no rendered Clear/Keypad/close-X controls.
- Transaction amount-isolation tests passed: Sale/Refund from Transactions always reset to zero before entry; a zero amount cannot continue; Void, Print, and Batch Info clear and ignore the Sale-home amount.
- Label-state tests passed: `TRANSACTION AMOUNT` stays fixed for every workflow while the standalone underlined title above it changes from `SALE` to the selected transaction type.
- Long-label sizing logic passed static inspection: `AUTH-INCREMENTAL` remains a single line at the long-label size tier, with reduced tracking and no truncation or ellipsis; short labels such as `SALE` use the larger tier.
- Payment-brand strip assertions passed: QR and GIFT no longer render the Alipay, WeChat Pay, or Factor4 brand rows above the tabs, and the associated dead CSS/JavaScript was removed.
- QR density assertions passed: the four QR actions remain present in a two-column grid, use fixed 148 px rows, align to the top, and no longer stretch to fill the available height.
- Key distinction assertions passed: Backspace now uses an amber icon, low-saturation yellow surface, and amber border; Clear uses a large red `C` on a pale-red destructive surface. The `00` key uses the same white numeric-key surface as the other digits.
- Channel-theme assertions passed: amount-entry transaction type, amount value, and OK button use blue for CARD, green for QR, and purple for GIFT; the bottom Sale action explicitly restores the blue entry theme.
- Navigation-theme assertions passed: selected bottom-navigation items use a channel-neutral graphite icon, light-grey surface, and subtle grey inset border instead of CARD blue, so navigation state remains consistent across QR and GIFT amount entry.
- Tip-screen continuity assertions passed: the merchant is `UNIQLO`, TSYS/Jose's Store branding is absent, Back is anchored at the top-left, and the amount hierarchy now uses the same underlined `SALE` context and grey `TRANSACTION AMOUNT` label as the revised home screen.
- Custom-Tip containment assertions passed: the Custom Tip panel is nested inside the Tip content sheet and replaces only the `Add a tip` region, leaving merchant and transaction amount visible. Its keypad matches the unified entry pattern with an amber icon Backspace, red `C`, white `00`, blue `OK`, 8 px gaps, and normalized responsive row height.
- Confirm-Tip containment assertions passed: the confirmation panel is also nested inside the Tip content sheet, uses a full in-sheet white replacement surface without page dimming or a floating modal card, and leaves merchant and transaction amount visible.
- Confirm-Tip hierarchy assertions passed: confirmation uses one dominant amount only. The persistent header changes from Transaction Amount to Total Amount and displays the final value, while the content sheet keeps a lightweight Transaction Amount/Tip breakdown and a Confirm button containing the final amount.
- Entry-stage transition tests passed: default zero-value Sale shows only the merchant logo; the first digit switches to the Sale amount state; clearing returns to the logo only for default Sale; pending transaction workflows always show their transaction type and amount state, including at zero.
- Navigation state test passed for Sale, Transactions, and Settings.
- Cash Change assertions passed: the legacy 720 x 1280 scaled canvas and overlay keypad were removed; the page now uses the shared 375 x 812 frame, centered UNIQLO header, top-left Back control, green CASH hierarchy, fixed Amount Due/Cash Received/Change summary, and fixed 14-key keypad. Input updates Cash Received and Change immediately, and OK blocks completion while a shortfall remains.
- Customer Copy assertions passed: the legacy Roboto receipt-preview screen, SMS option, placeholder merchant, product-line details, and always-primary Print button were removed. The replacement uses the shared 375 x 812 frame, Inter, centered UNIQLO header, approved amount hierarchy, explicit Merchant Copy printed state, and exactly Email/Print/No Receipt choices. Email validates inline, Print exposes a printable 80 mm customer copy, and No Receipt completes directly. Cash completion and the card-approval helper both forward amount and payment method into this page.
- `git diff --check` passed.

**Required fidelity surfaces**

- Fonts and typography: implementation retains Inter and adds Material Symbols Rounded; visual font loading and optical hierarchy remain unverified.
- Spacing and layout rhythm: designed for the existing 375 x 812 frame; visual fit and scroll behavior remain unverified.
- Colors and visual tokens: existing blue/white POS palette is retained; rendered contrast and balance remain unverified.
- Image quality and asset fidelity: existing QR/Gift payment assets are preserved; the merchant slot uses the vector UNIQLO mark sourced from Wikimedia Commons.
- Copy and content: the receipt screen uses `PAYMENT APPROVED`, `TOTAL AMOUNT`, `Merchant copy printed`, and `CUSTOMER COPY`; it intentionally omits SMS, environmental marketing copy, and Dejavoo branding.

**Primary interactions requiring browser verification**

- Enter amount and press OK for Sale.
- Open Transactions, switch CARD/QR/GIFT, and select an amount-required action after entering a non-zero Sale-home amount.
- Confirm that the app clears the home amount, returns to the fixed keypad for fresh entry, and only forwards the newly entered amount on OK.
- Open Settings, toggle payment groups, and verify Transactions updates.
- Open Print, Batch Info, and Cash Discount subviews.
- On Cash Change, enter less than the amount due and verify the shortfall warning and card feedback.
- Clear the value, enter more than the amount due, verify live Change, and press OK to complete.
- On Customer Copy, test Email validation and successful submission, Print, No Receipt, and the transition back to the Sale home.
- Check browser console errors.

**Comparison history**

- Iteration 1: fixed-entry home and bottom navigation implemented; static checks passed; visual comparison blocked because no browser-rendered screenshot could be captured.
- Iteration 2: feedback applied for UNIQLO logo sizing, SALE label, Enter Amount hierarchy, lower keypad placement, removed Transactions header, and fresh transaction amounts; browser surfaces remain unavailable.
- Iteration 3: merchant and amount regions separated, amount moved directly above the keypad, Enter Amount centered between two lines, transaction type moved below the amount, bottom labels removed, and `TRANSACTION AMOUNT` fixed across workflows; browser surfaces remain unavailable.
- Iteration 4: logo and amount were consolidated into one fixed stage above the keypad; the default empty Sale state shows the logo, numeric input crossfades to transaction type plus amount, and pending transaction workflows bypass the logo state; browser surfaces remain unavailable.
- Iteration 5: both entry states are now vertically and horizontally centered within the full area above the keypad; the merchant logo was enlarged to 96 px, the amount state grew to 180 px, and spacing between transaction type, amount label, amount value, and validation copy was increased; browser surfaces remain unavailable.
- Iteration 6: the first bottom-navigation icon now performs a full default-Sale reset instead of a view-only switch, clearing pending actions and amount data before restoring the merchant-logo state; the dedicated reset behavior test passed; browser surfaces remain unavailable.
- Iteration 7: the transaction-type pill was replaced with the selected standalone blue wordmark and short underline. Responsive font-size and tracking tiers were added so `AUTH-INCREMENTAL` stays on one line while `SALE` remains more prominent; JavaScript parsing and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 8: QR/GIFT payment-brand rows were removed, including their unused styling and update logic. The four QR transaction cards were reduced to two compact 148 px rows with a 12 px grid gap and top alignment; JavaScript parsing, component assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 9: Clear was given a restrained pale-red destructive treatment with a stronger border and pressed state. After refinement, its label remains the conventional large `C`, while Backspace retains the blue utility-key surface and red line icon; the two functions are distinguished without breaking the keypad's visual rhythm. Static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 10: Backspace was converted to a blue utility action with a blue icon, pale-blue surface, matching border, and dedicated pressed state. The `00` key was removed from the function-key treatment and restored to the same white surface as numeric keys; static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 11: Backspace was refined from blue to a low-saturation amber warning treatment, separating the reversible delete-one-digit action from the red destructive Clear action and blue confirmation action. Its default and pressed states both retain readable contrast; static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 12: amount entry gained a channel-scoped theme independent of global navigation. CARD workflows retain blue, QR workflows use green, GIFT workflows use purple, and the transaction type, amount value, OK button, and button shadow update together. Returning through the Sale navigation action resets the entry theme to blue; static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 13: bottom-navigation selection was decoupled from payment-channel colors. The active item now uses a graphite icon on a light-grey surface with a subtle neutral border and elevation, while QR/GIFT colors remain confined to the transaction-entry content; static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 14: the Tip selection screen was aligned with the revised Sale entry experience. Merchant identity changed to centered `UNIQLO`, the TSYS payment-channel mark was removed, Back moved to the top-left, the background token now matches the home screen, and the amount block uses the underlined `SALE` context with a neutral `TRANSACTION AMOUNT` label. Tip calculation and selection behavior were preserved; JavaScript parsing, screen assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 15: Custom Tip changed from a phone-level modal that obscured the transaction amount to an in-sheet replacement panel occupying exactly the `Add a tip` region. The keypad was rebuilt to match the unified POS keypad hierarchy, spacing, radii, shadows, Backspace icon, amber/red/white/blue semantic keys, and compact-height behavior; open, close, input, and confirmation logic remain unchanged. JavaScript parsing, containment/style assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 16: Confirm Tip was moved from a phone-level dimmed modal into the same content-sheet replacement system as Custom Tip. Its floating-card radius, shadow, overlay dimming, and center-modal transform were removed; summary, total, Change, and Confirm now occupy the `Add a tip` region while merchant and transaction amount remain visible. Confirmation behavior is unchanged; JavaScript parsing, containment/style assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 17: the expanded Confirm Tip region was redesigned rather than scaling the former modal. It now has a page heading and review instruction, a bounded Total Amount hero card, a two-row transaction/tip breakdown with dynamic percentage or Custom Tip labeling, and bottom-anchored actions. The total copy was simplified to the amount alone, and all calculation/confirmation behavior remains unchanged; JavaScript parsing, hierarchy assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 18: confirmation adopted a single-dominant-amount model. The large Total Amount card was removed; opening confirmation changes the persistent header label/value to Total Amount and the final value, while Change restores Transaction Amount and its original value. The content sheet now contains only the transaction/tip breakdown, and the primary action includes the final amount. Tip values use a leading plus sign for clearer arithmetic; JavaScript parsing, state assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 19: the redundant Confirm Tip review subtitle was removed, leaving a cleaner title-to-breakdown hierarchy; its unused styling was removed as well. Static assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 20: completing the Tip step now routes to `10.cash_discount.html` instead of the obsolete card-wait target. The final amount including Tip is passed as `amountCents`, while original transaction amount and Tip are also preserved as query parameters and local-storage values. No Tip follows the same transition with a zero Tip; JavaScript parsing, route assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 21: restricted promotional/payment-guidance content was removed from the Cash Discount choice screen: Save 4%, Standard, cash explanatory/savings copy, card usage instructions, and Visa/Mastercard/Amex/Discover marks. Associated CSS and DOM-update code were removed while Cash/Card labels, calculated amounts, selection state, payload calculations, and actions were preserved; JavaScript parsing, forbidden-copy assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 22: the Cash Discount screen was converted from a scaled 720 × 1280 design canvas to the same fixed 375 × 812 terminal frame used by `1.unified_pos.html`. Legacy fit-scale/visualViewport code was removed, and panel padding, typography, cards, radii, gaps, and buttons were proportionally resized for the unified frame. Cash/Card logic and navigation behavior remain unchanged; JavaScript parsing, frame assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 23: the Cash/Card choice screen gained generic, non-branded payment imagery without restoring restricted copy: banknote and card icon tiles, stronger identity grouping, selected check indicators, fuller card height/elevation, and a payment-method icon in the primary action. Selection now also synchronizes `aria-pressed`, button label, and icon. Promotional claims, usage instructions, and card-network logos remain absent; JavaScript parsing, restricted-content/icon-state assertions, and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 24: excess vertical whitespace was reduced by increasing each payment card from 154 px to 196 px and enlarging the Cash/Card titles, payment icon tiles, selection indicator, amount typography, internal padding, and identity spacing. The cards remain vertically balanced between the page title and actions, with no restricted marketing or network content reintroduced; static sizing assertions and `git diff --check` passed; browser surfaces remain unavailable.
- Iteration 25: Cash Change was rebuilt around the selected Dejavoo single-screen workflow while adopting the established POS design system. The scaled 720 x 1280 canvas, summary stack, Finish footer, and overlay keypad were replaced with a 375 x 812 UNIQLO screen containing a top-left Back control, green CASH workflow label, compact Amount Due/Cash Received/Change hierarchy, and always-visible keypad. Cash Received and Change now update on every key press; OK gives an inline shortfall warning or completes the cash payment. JavaScript parsing, amount/change assertions, route compatibility, and `git diff --check` passed; browser-rendered comparison remains blocked because no browser surface is available.
- Iteration 26: Cash Change status copy was reduced to exception-only messaging: the row stays visually empty at zero and when payment is sufficient, and only renders `Still due` for a shortfall without shifting surrounding layout. Cash Received now uses a neutral white card and dark amount, while Change uses a graphite high-contrast card with a white, slightly larger amount so the value returned to the customer is immediately distinguishable from the green cash workflow. Static state/copy assertions and `git diff --check` passed; browser-rendered comparison remains blocked.
- Iteration 27: the graphite Change card was softened after feedback that it diverged too far from the established interface. Change now uses the existing pale cash-green surface, a clearer green border, restrained green shadow, and a slightly larger deep-green amount, while Cash Received remains neutral white for differentiation. The metric row was also moved 10 px farther from the dominant Amount Due value, increasing that separation from 16 px to 26 px. Static token/spacing assertions and `git diff --check` passed; browser-rendered comparison remains blocked.
- Iteration 28: the separation between the dominant Amount Due value and the Cash Received/Change row was increased again from 26 px to 34 px, creating a clearer hierarchy without changing the fixed keypad or one-screen interaction model. Static spacing and script checks passed; browser-rendered comparison remains blocked.
- Iteration 29: `6_receipt.html` was rebuilt from the selected Dejavoo Customer Copy reference while retaining the established POS design system. The old receipt preview, SMS action, placeholder company/product data, and separate print footer were replaced with a 375 x 812 UNIQLO success screen showing Payment Approved, Total Amount, Merchant copy printed, and exactly three customer-copy choices: Email, Print, and No Receipt. Email replaces the choice region with an inline validated form; Print uses a dedicated 80 mm print layout; No Receipt ends the flow. Cash completion and the card-approval helper now route into the page with the correct amount/payment method. JavaScript parsing, route/action assertions, legacy-content checks, and scoped `git diff --check` passed; browser-rendered comparison remains blocked because no browser surface is available.

**Implementation checklist**

- Capture Sale, Transactions, and Settings at 375 x 812.
- Capture Cash Change at 375 x 812 in empty, shortfall, and sufficient-payment states.
- Capture Customer Copy at 375 x 812 in option-choice and Email-entry states.
- Fix any P0/P1/P2 clipping, overlap, font, icon, or interaction issues found.
- Repeat the combined visual comparison and update this report.

final result: blocked
