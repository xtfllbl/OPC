# Design QA

- Source visual truth: latest user-provided Sale keypad and terminal-control reference screenshots in the current conversation (no local attachment path exposed)
- Implementation: `1.unified_pos.html`
- Implementation screenshot: unavailable because no in-app Browser or Chrome surface is available in this session
- Intended viewport: 375 x 812
- State: Sale home keypad, empty amount

**Full-view comparison evidence**

Blocked. The source references are visible in the conversation, but a browser-rendered implementation screenshot could not be captured, so the required combined visual comparison could not be produced.

**Focused region comparison evidence**

Blocked for the same reason. The intended focus regions are the merchant/amount hierarchy, fixed keypad, persistent bottom navigation, Transactions view, and Settings view.

**Findings**

- [P1] Browser-rendered visual verification unavailable
  - Location: full Sale, Transactions, and Settings views.
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
- Entry-stage transition tests passed: default zero-value Sale shows only the merchant logo; the first digit switches to the Sale amount state; clearing returns to the logo only for default Sale; pending transaction workflows always show their transaction type and amount state, including at zero.
- Navigation state test passed for Sale, Transactions, and Settings.
- `git diff --check` passed.

**Required fidelity surfaces**

- Fonts and typography: implementation retains Inter and adds Material Symbols Rounded; visual font loading and optical hierarchy remain unverified.
- Spacing and layout rhythm: designed for the existing 375 x 812 frame; visual fit and scroll behavior remain unverified.
- Colors and visual tokens: existing blue/white POS palette is retained; rendered contrast and balance remain unverified.
- Image quality and asset fidelity: existing QR/Gift payment assets are preserved; the merchant slot uses the vector UNIQLO mark sourced from Wikimedia Commons.
- Copy and content: the example merchant is UNIQLO, the current transaction type is shown as a standalone underlined title above `TRANSACTION AMOUNT`, and bottom navigation uses accessible icon-only controls.

**Primary interactions requiring browser verification**

- Enter amount and press OK for Sale.
- Open Transactions, switch CARD/QR/GIFT, and select an amount-required action after entering a non-zero Sale-home amount.
- Confirm that the app clears the home amount, returns to the fixed keypad for fresh entry, and only forwards the newly entered amount on OK.
- Open Settings, toggle payment groups, and verify Transactions updates.
- Open Print, Batch Info, and Cash Discount subviews.
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

**Implementation checklist**

- Capture Sale, Transactions, and Settings at 375 x 812.
- Fix any P0/P1/P2 clipping, overlap, font, icon, or interaction issues found.
- Repeat the combined visual comparison and update this report.

final result: blocked
