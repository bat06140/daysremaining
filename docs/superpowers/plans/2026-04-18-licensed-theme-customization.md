## Goal

Replace `showCopyright` with `hasLicense`, add premium color customization backed by a shared cookie, expose a hover-only palette control that opens a save/cancel popup, and normalize the calendar spacing.

## Work Items

1. Add pure theme helpers
- Create a typed theme model with default colors.
- Add cookie serialization/parsing helpers.
- Add color opacity helpers for calendar muted days.
- Test these helpers first.

2. Add shared runtime theme state
- Create a React provider that reads the theme cookie once and updates both React state and the cookie on save.
- Wrap the app so all rendered widgets share the same premium theme state.

3. Add reusable premium controls
- Build a hover-revealed palette trigger.
- Build a popup with two color pickers plus `Valider` and `Annuler`.
- Gate the control behind `hasLicense`.

4. Apply the theme to widgets
- Replace `showCopyright` with `hasLicense`.
- `hasLicense=false`: show branding footer and hide premium controls.
- `hasLicense=true`: hide branding footer and enable premium palette editing.
- Apply theme colors to `Calendar`, `Clock`, and `DaysRemaining`.
- Use lower-opacity text in `Calendar` for out-of-month dates based on the chosen primary color.

5. Fix layout inconsistency
- Remove the extra bottom margin on the calendar header and rely on the container gap for consistent spacing.

6. Verify
- Run `npm run test`
- Run `npm run lint`
- Run `npm run build`
