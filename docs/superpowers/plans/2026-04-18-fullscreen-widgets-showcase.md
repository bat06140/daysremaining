## Objective

Keep the existing square versions of the three widgets intact, add full-page variants for each widget, guarantee text auto-sizing so content never overflows its container, and add a showcase page that displays the three widgets together in a resizable grid where each panel can switch between the available widgets.

## Files To Modify

- `src/App.tsx`: replace the single env-selected render path with a small view resolver that supports single-widget views and the showcase page.
- `src/components/SquareContainer.tsx`: generalize the container so square and full-page layouts share one implementation.
- `src/components/AutosizeText.tsx`: make text sizing width-aware and height-aware so it shrinks until the content fits.
- `src/components/AutosizeButton.tsx`: reuse the same fitting strategy for button labels.
- `src/components/Calendar.tsx`: support both `square` and `full` layouts without changing the default square behavior.
- `src/components/CenteredPopover.tsx`: support both layout modes for the `DaysRemaining` card and its embedded calendar popover.
- `src/components/DaysRemaining.tsx`: thread the new layout mode through the widget.
- `src/components/FlipClock.tsx`: replace the current viewport-based font sizing with container-based auto-fit logic and support both layouts.
- `src/index.css`: add app-level styles needed for full-page and showcase layouts.
- `package.json`: add a local test script for pure TypeScript utilities if needed.

## Files To Create

- `src/lib/view-config.ts`: pure helpers for resolving which page to render from URL search params and environment defaults.
- `src/lib/showcase-layout.ts`: pure helpers for clamping and updating resizable panel ratios.
- `src/components/WidgetShowcase.tsx`: the resizable three-panel page with per-panel widget selectors.
- `src/components/widget-registry.tsx`: widget metadata and render mapping shared by the app and the showcase.
- `tests/view-config.test.ts`: failing-first tests for URL/view resolution.
- `tests/showcase-layout.test.ts`: failing-first tests for split ratio updates and clamping.
- `tests/tsconfig.json`: compile tests and targeted source files to a temporary output directory for `node --test`.

## Implementation Tasks

### Task 1: Add failing tests for pure view and layout logic

Create `src/lib/view-config.ts` and `src/lib/showcase-layout.ts` only as minimal stubs if necessary, then add tests that define the new behavior:

- single-widget square view by default when a widget is selected
- full-page mode when `layout=full`
- showcase page when `view=showcase`
- environment fallback when no query param is provided
- ratio clamping for both vertical and horizontal splits
- drag updates that never collapse a panel below the minimum size

Run the test command and confirm it fails for the expected reasons before implementing the helpers.

### Task 2: Implement the view resolver and widget registry

Introduce a small typed routing layer based on `URLSearchParams` so the app can render:

- a single widget in `square` mode
- a single widget in `full` mode
- the showcase grid

Keep existing env-based entry points working by treating `VITE_COMPONENT` as the default widget when no query param is present.

### Task 3: Replace the square-only container with a shared layout container

Refactor `SquareContainer` into a more general container that accepts a `layout` prop:

- `square`: preserve current square behavior
- `full`: occupy the full available width and height

Keep the current default as `square` so existing widget usage remains stable unless a full-page mode is explicitly requested.

### Task 4: Fix text auto-sizing at the component level

Update `AutosizeText` and `AutosizeButton` so the font size is derived from real container bounds and shrinks until the rendered text fits both width and height constraints.

Then refactor `FlipClock` to use this shared sizing path instead of viewport-based `vh`/`vw` values.

### Task 5: Add full-page variants for each widget

Thread a `layout` prop through `Calendar`, `DaysRemaining`, `CenteredPopover`, and `FlipClock`. Preserve the current square presentation as the default and define a full-page version that uses the new shared container while keeping the visual identity of each widget.

### Task 6: Build the showcase page

Implement `WidgetShowcase` with:

- three panels in a desktop resizable layout
- one vertical handle for left/right resizing
- one horizontal handle for the two right-side panels
- a widget selector in each panel
- mobile fallback to a stacked layout without drag handles

Persisting selections is optional and should not be added unless it falls out naturally from the implementation.

### Task 7: Verify integration

Run:

- tests for pure helpers
- `npm run build`
- `npm run lint`

Then manually inspect the resulting URLs and confirm the square, full-page, and showcase paths all resolve correctly.

## Testing Notes

Because the repository does not currently include a browser test runner, keep tests focused on pure TypeScript helpers compiled to JS for `node --test`. UI verification will rely on build/lint plus manual inspection of the generated markup and runtime behavior.
