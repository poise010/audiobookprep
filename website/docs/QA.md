# Website verification

Verified September 18, 2026 against the standalone local website.

## Automated checks

`npm run check` passes six tests covering inclusive plan allowance boundaries, annual totals and savings, invalid pricing inputs, local assets/links/anchors, the self-contained Squarespace JavaScript bundle, and generated snippet paths. JavaScript syntax checks and the static production build pass.

The Unslop UI scanner reported zero high-severity findings in the website assets. Its regex scan is not a substitute for visual inspection.

## Browser checks

- Desktop homepage and full-page composition reviewed visually.
- Homepage widths 320, 390, 768, 1024 and 1440 pixels: no document overflow or overflowing headings detected.
- Studio page checked at desktop and 320 pixels; no document or heading overflow detected.
- Mobile menu opens and closes, closes after navigation, and reports its expanded state.
- All three fictional guide sections switch correctly.
- Yearly billing updates all three prices, annual totals and calculator output.
- Allowance-boundary recommendations and beyond-Studio capacity messages checked.
- Keyboard selection and Backspace produce a blank input with an accessible validation message. Negative input is also rejected.
- Membership dialog shows the selected plan and billing interval; Escape closes it and returns focus to its trigger.
- FAQ disclosure and preview-information dialog work.
- Studio links resolve to the coming-soon page. Download links resolve to the actual sample file.
- No browser console warnings or errors observed during these checks.

## Contrast

Relative luminance calculated from the authored OKLCH tokens:

| Text / background             | Contrast |
| ----------------------------- | -------: |
| Main ink / white              |  17.75:1 |
| Secondary text / white        |   6.85:1 |
| Secondary text / pale surface |   6.18:1 |
| Indigo / pale indigo          |   5.94:1 |
| White / indigo button         |   7.22:1 |
| Light copy / dark section     |   9.17:1 |

Reduced-motion styles disable entrance and press movement. Keyboard-initiated actions disable transitions. Semantic HTML, labeled controls, a skip link, visible focus, and native dialog/disclosure behavior are implemented. This is not a third-party accessibility certification or a physical-device test.

## Refinements made during verification

| Before                              | After                                              | Why                                                              |
| ----------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| Shared CSS class selectors          | Rules scoped to `.abp-site`                        | Reduce interference with a future Squarespace template           |
| Imported pricing module in source   | Self-contained module in Squarespace footer export | Avoid asset renaming breaking relative module imports            |
| Calculator only listened for typing | Also validates on change and blur                  | Keep feedback current when a browser updates a field differently |
| Dense one-line source               | Formatted HTML, CSS and JavaScript                 | Make editing in VS Code straightforward                          |

## Deployment limits

The site has not been deployed or installed inside the actual Squarespace template. Squarespace wrapper layout, code-injection availability, hosting headers, metadata/social image, and actual asset URLs must be verified when integrating. No backend, auth, billing, AI processing, uptime/performance claim or privacy guarantee for future software is implied by these checks.
