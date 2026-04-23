# Widget Theme Editor Freemium Step 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the theme editor freemium flow open the popup with locked step-1 color cards, shrink the picker handles so they stay inside the panel, and polish step 1 visually.

**Architecture:** Keep `WidgetThemeEditor` as the single owner of popup flow and mode branching. Extend the step-1 card renderer so premium and freemium presentation differences stay local, and use scoped CSS in `index.css` for `react-colorful` handle sizing rather than JS changes.

**Tech Stack:** React, TypeScript, Tailwind utility classes, `react-colorful`, Node test runner

---

### Task 1: Lock The Desired Freemium Behavior In Tests

**Files:**
- Modify: `apps/widget-client/tests/widget-theme-editor.test.ts`
- Test: `apps/widget-client/tests/widget-theme-editor.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test("WidgetThemeEditor freemium mode uses a button trigger instead of a direct purchase link", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "freemium",
      purchaseUrl: "https://example.com/purchase",
    })
  );

  assert.match(markup, /aria-label="Customize widget colors"/);
  assert.doesNotMatch(markup, /href="https:\/\/example\.com\/purchase"/);
});

test("WidgetThemeEditor freemium step 1 renders locked premium cards", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "freemium",
      purchaseUrl: "https://example.com/purchase",
      initialOpen: true,
    })
  );

  assert.match(markup, /href="https:\/\/example\.com\/purchase"/);
  assert.match(markup, /data-theme-editor-card="locked"/);
  assert.match(markup, /Unlock premium theme customization/);
  assert.doesNotMatch(markup, /aria-label="Back to color list"/);
});

test("WidgetThemeEditor picker shell keeps compact pointer styling hooks", () => {
  const markup = renderWithTheme(
    React.createElement(WidgetThemeEditor, {
      mode: "premium",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      initialOpen: true,
      initialActiveColorKey: "color1",
    })
  );

  assert.match(markup, /widget-color-picker/);
  assert.match(markup, /react-colorful/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/widget-client run test -- widget-theme-editor.test.ts`
Expected: FAIL because freemium still renders a direct purchase link trigger and step 1 does not expose locked-card markup.

- [ ] **Step 3: Commit**

```bash
git add apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "test: cover freemium theme editor flow"
```

### Task 2: Implement The Freemium Step-1 Card Flow

**Files:**
- Modify: `apps/widget-client/src/components/WidgetThemeEditor.tsx`
- Test: `apps/widget-client/tests/widget-theme-editor.test.ts`

- [ ] **Step 1: Implement the card variants in the editor**

```tsx
const ThemeColorField = ({
  label,
  colorValue,
  onActivate,
  variant = "editable",
  purchaseUrl,
  lockLabel,
}: {
  label: string;
  colorValue: string;
  onActivate: () => void;
  variant?: "editable" | "locked";
  purchaseUrl?: string;
  lockLabel?: string;
}) => {
  const isLockedVariant = variant === "locked";

  const content = (
    <>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] text-black/40">
          {label}
        </div>
        <div className="mt-[3px] truncate text-[24px] font-semibold leading-none text-notion-black">
          {formatThemeInputValue(colorValue, "hex")}
        </div>
        <div className="mt-[4px] truncate text-[11px] text-black/55">
          {formatThemeInputValue(colorValue, "rgba")}
        </div>
      </div>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-black/10 shadow-inner">
        {isLockedVariant ? <Lock size={12} /> : null}
      </span>
    </>
  );

  if (isLockedVariant && purchaseUrl) {
    return (
      <a
        data-theme-editor-card="locked"
        href={purchaseUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={lockLabel}
        className="..."
      >
        {content}
      </a>
    );
  }

  return (
    <button data-theme-editor-card="editable" type="button" className="..." onClick={onActivate}>
      {content}
    </button>
  );
};
```

- [ ] **Step 2: Use the correct trigger behavior by mode**

```tsx
const isLocked = mode === "locked";
const isFreemium = mode === "freemium";

{isLocked ? (
  <a ... href={purchaseUrl}>...</a>
) : (
  <button
    type="button"
    ...
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveColorKey(null);
      setInputMode("hex");
      setInputDraft(formatThemeInputValue(theme.color1, "hex"));
      setIsOpen(true);
    }}
  >
    {paletteContents}
  </button>
)}
```

- [ ] **Step 3: Render locked step-1 cards for freemium and preserve premium editing**

```tsx
{activeColorKey == null ? (
  <div className="grid h-full content-start gap-[8px] transition-opacity duration-150">
    <ThemeColorField
      label={translations.themeEditor.color1}
      colorValue={theme.color1}
      onActivate={() => setActiveColorKey("color1")}
      variant={isFreemium ? "locked" : "editable"}
      purchaseUrl={isFreemium ? purchaseUrl : undefined}
      lockLabel={translations.themeEditor.unlockAriaLabel}
    />
    <ThemeColorField
      label={translations.themeEditor.color2}
      colorValue={theme.color2}
      onActivate={() => setActiveColorKey("color2")}
      variant={isFreemium ? "locked" : "editable"}
      purchaseUrl={isFreemium ? purchaseUrl : undefined}
      lockLabel={translations.themeEditor.unlockAriaLabel}
    />
  </div>
) : (
  ...
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/widget-client run test -- widget-theme-editor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "feat: add freemium theme editor step 1 flow"
```

### Task 3: Tighten Picker Styling And Polish Step 1

**Files:**
- Modify: `apps/widget-client/src/components/WidgetThemeEditor.tsx`
- Modify: `apps/widget-client/src/index.css`
- Test: `apps/widget-client/tests/widget-theme-editor.test.ts`

- [ ] **Step 1: Refine step-1 card visuals in the component**

```tsx
className={cn(
  "group flex min-w-0 items-center justify-between gap-[10px] rounded-[10px] border px-[10px] py-[10px] text-left transition",
  isLockedVariant
    ? "border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,247,244,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:border-black/20"
    : "border-black/10 bg-white/92 hover:border-black/20"
)}
```

- [ ] **Step 2: Reduce the visible picker handles with scoped CSS**

```css
.widget-color-picker .react-colorful__pointer {
  width: 18px;
  height: 18px;
}

.widget-color-picker .react-colorful__hue-pointer,
.widget-color-picker .react-colorful__alpha-pointer {
  width: 16px;
  height: 16px;
}

.widget-color-picker .react-colorful__pointer-fill {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.96), 0 1px 4px rgba(0, 0, 0, 0.22);
}
```

- [ ] **Step 3: Run the targeted test suite again**

Run: `pnpm --filter @repo/widget-client run test -- widget-theme-editor.test.ts`
Expected: PASS

- [ ] **Step 4: Run repo verification**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both commands pass without new type or build errors.

- [ ] **Step 5: Commit**

```bash
git add apps/widget-client/src/components/WidgetThemeEditor.tsx apps/widget-client/src/index.css apps/widget-client/tests/widget-theme-editor.test.ts
git commit -m "style: polish theme editor freemium popup"
```
