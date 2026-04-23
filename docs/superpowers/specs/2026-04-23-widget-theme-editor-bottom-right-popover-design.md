# Widget Theme Editor Bottom-Right Popover Design

## Goal

Replace the current centered `WidgetThemeEditor` modal with a compact bottom-right popover that stays fully inside the widget, applies theme changes instantly, and closes when the user clicks outside the popup but still inside the widget.

## User Experience

### Open State

- The palette button remains anchored at the bottom-right of the widget.
- Clicking the palette button opens a compact popup anchored to that same corner.
- The popup never overflows outside the widget bounds.
- The opening animation should feel like the palette button expands into the popup rather than spawning a separate modal.

### Close State

- Clicking anywhere in the widget outside the popup closes the popup.
- That outside click must not fall through to the widget content underneath.
- There is no close icon in the popup.

### Editing Model

- Theme changes apply immediately when the user changes a color.
- There are no `Cancel` or `Apply` buttons.
- Closing the popup keeps the last edited state.

## Popup Structure

### Step 1: Color Selection

The initial popup is compact and shows only the two color entries:

- color 1
- color 2

Each entry remains clickable and transitions to the detailed editing state.

### Step 2: Color Editing

The detailed editing state contains:

- a back arrow button on the left
- the `HEX / RGBA` mode toggle to the right of the back button
- the value input on the same top row
- the color picker below

The following elements are removed from the current UI:

- title
- close button
- cancel button
- apply/confirm button

## Layout Rules

- The popup is visually attached to the bottom-right corner of the widget.
- The popup stays entirely within the widget rectangle in both steps.
- Step 1 is smaller than Step 2.
- Step 2 grows upward and leftward from the same bottom-right anchor so the bottom-right edge remains visually stable.

## Animation Rules

### Open / Close

- Opening animation:
  - starts from the palette button position
  - expands into the step 1 popup
  - uses a short scale + opacity transition
- Closing animation:
  - shrinks back toward the palette button
  - uses the reverse transition

### Step 1 <-> Step 2

- Transition between steps is animated.
- The popup should resize smoothly rather than switching dimensions abruptly.
- The anchor remains the bottom-right corner during the resize.
- The content fade/slide should be subtle and secondary to the panel resize.

Target motion characteristics:

- short duration, roughly 180ms to 220ms
- ease-out for opening and step expansion
- no springy or exaggerated motion

## Interaction Model

### Event Capture

When the popup is open:

- an invisible overlay covers the widget area
- the overlay captures pointer events outside the popup
- clicking that overlay closes the popup
- the underlying widget must not receive that click

### Locked Mode

Locked mode keeps the existing premium purchase affordance behavior:

- clicking the locked palette control still opens the purchase URL
- no editing popup opens in locked mode

### Hidden Mode

Hidden mode remains unchanged:

- no palette button
- no popup

## State Model

### Persisted State

The persisted widget theme remains the single source of truth.

- Color updates are saved immediately through the existing theme context.
- The editor no longer needs a staged draft for cancel/apply semantics.

### Local UI State

The editor still needs lightweight local state for:

- whether the popup is open
- which color is currently active
- whether the editor is on step 1 or step 2
- whether the input mode is `hex` or `rgba`
- the current text input value while typing

## Component-Level Changes

### `WidgetThemeEditor.tsx`

This file remains the primary implementation point.

Required changes:

- replace centered modal layout with anchored bottom-right popover layout
- remove modal header and footer actions
- switch color application to immediate save behavior
- add step-resize animation
- add widget-scoped click-capture overlay

### Widget Container Integration

The editor must continue to live inside the widget container so that:

- the popup is clipped to widget bounds
- outside clicks are captured only inside the widget
- the popup remains visually attached to the widget corner

No global portal should be introduced for this interaction.

## Styling Direction

- Keep the popup compact and close to the existing design language.
- Maintain the existing rounded corners and light panel treatment.
- Prefer subtle shadow and opacity transitions over heavy transforms.
- The popup should feel like a utility panel, not a modal dialog.

## Accessibility

- The palette trigger still needs an accessible label.
- The back button needs an accessible label.
- The `HEX / RGBA` toggle and value input remain keyboard reachable.
- Focus behavior should remain predictable when switching between steps.

No additional focus trap is required because this is no longer a modal dialog.

## Testing Strategy

### Rendering Tests

Add or update tests to verify:

- hidden mode still renders nothing
- locked mode still renders the purchase affordance
- the open editor no longer renders title, close button, cancel button, or apply button
- step 2 renders the back button, mode toggle, and input above the picker

### Behavior Tests

Add or update tests to verify:

- changing the picker value updates the theme immediately
- step transitions do not require an explicit confirmation action
- clicking outside the popup closes it
- the overlay intercepts outside clicks instead of allowing the widget underneath to receive them

### Regression Coverage

Preserve coverage for:

- purchase URL threading in locked mode
- hidden-mode suppression
- premium-mode rendering

## Recommendation

Implement the editor as an anchored bottom-right popover with a widget-scoped overlay and immediate-save editing.

This preserves the existing widget-local interaction model while making the UI feel lighter, faster, and more consistent with the bottom-right palette trigger.
