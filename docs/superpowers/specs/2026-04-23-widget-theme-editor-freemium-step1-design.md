# Widget Theme Editor Freemium Step 1 Design

## Goal

Refine the bottom-right `WidgetThemeEditor` so it feels polished in both premium and freemium modes without reintroducing a centered modal or server-driven behavior.

This iteration adds three concrete improvements:

1. Reduce the visible picker handles so they stay inside the popup bounds.
2. Change freemium behavior so the palette button opens the editor instead of redirecting immediately.
3. Redesign step 1 so freemium users see a locked premium teaser directly inside the popup.

## Current Problems

- The `react-colorful` handles are visually too large for the compact popup and can protrude beyond the panel.
- In freemium mode, clicking the palette button immediately leaves the widget for the purchase page, which prevents discovery of the editor UI.
- Step 1 is functional but visually flat, especially now that it is the primary freemium entry point.

## Desired Behavior

### Premium

- Clicking the palette button opens the popup on step 1.
- Both color cards are editable entry points into step 2.
- Step 2 continues to apply theme updates instantly.

### Freemium

- Clicking the palette button opens the popup on step 1 instead of navigating away immediately.
- Step 1 shows both color cards in a locked premium style.
- Clicking either color card opens `purchaseUrl` in a new tab.
- Freemium users never enter step 2 from the popup.

## Step 1 Presentation

Step 1 keeps the same two-card structure but becomes more intentional:

- More generous padding and spacing inside each card.
- Cleaner hierarchy between label, hex value, and rgba value.
- Slightly richer card treatment for locked cards, using a subtle premium surface rather than a plain flat white block.
- Lock affordance integrated into each card instead of a separate footer or CTA row.
- The swatch remains on the right and stays visually compact.

The design should remain small enough to fit the widget without overflow and should still feel like part of the widget, not a detached dialog.

## Step 2 Picker Refinement

- Reduce the apparent size of the picker knobs/handles through CSS only.
- Keep the existing picker structure and interactions unchanged.
- Do not change saturation, hue, or alpha layout beyond what is needed to avoid visual overflow.

## Component Responsibilities

### `WidgetThemeEditor.tsx`

- Treat `mode === "locked"` as the fully hidden editor path that still uses the direct purchase CTA on the palette button.
- Treat `mode === "freemium"` as a popup-enabled mode:
  - open step 1 from the palette button
  - render locked cards on step 1
  - route card clicks to `purchaseUrl`
  - prevent access to step 2
- Keep `mode === "premium"` on the current editable path.

### `ThemeColorField`

The step 1 card renderer should support two presentation modes:

- editable
- locked-premium

The locked variant owns:

- lock icon
- premium surface treatment
- purchase click behavior

This keeps step 1 rendering explicit instead of scattering mode checks around the parent markup.

### `index.css`

- Add targeted `react-colorful` handle sizing rules scoped to `.widget-color-picker`.
- Avoid global picker changes outside this editor.

## Testing

Update server-rendered widget editor tests to cover:

- freemium mode opens the popup instead of rendering a direct purchase link on the palette button
- freemium step 1 renders locked color cards
- freemium markup does not expose the step 2 editing shell by default
- premium mode still renders editable step 1 / step 2 affordances
- picker shell styling remains present through class-based assertions where practical

## Non-Goals

- No change to the centered-modal removal.
- No new freemium messaging banner or separate CTA footer.
- No change to the instant-save behavior in premium mode.
- No change to backend licensing or access APIs.
