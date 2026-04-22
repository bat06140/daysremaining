import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, Palette, X } from "lucide-react";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { cn } from "../lib/utils.js";
import { useWidgetTheme } from "../hook/useWidgetTheme.js";
import { getBrowserLocale, getTranslationSet } from "../lib/locale.js";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type ThemeEditorMode,
} from "../lib/widget-access.js";
import {
  formatRgbaString,
  formatThemeInputValue,
  normalizeThemeStorageColor,
  parseWidgetThemeColor,
  RgbaColorValue,
  ThemeInputMode,
  WidgetTheme,
} from "../lib/widget-theme.js";

type ThemeColorKey = keyof WidgetTheme;

const defaultRgba: RgbaColorValue = { r: 55, g: 53, b: 47, a: 1 };

const ThemeColorField = ({
  label,
  colorValue,
  onActivate,
}: {
  label: string;
  colorValue: string;
  onActivate: () => void;
}) => {
  const rgba = parseWidgetThemeColor(colorValue) ?? defaultRgba;

  return (
    <button
      type="button"
      className="flex min-w-0 items-center justify-between gap-[2px] rounded-[8px] border border-black/10 bg-[#f6f2ea] px-[2px] py-[2px] text-left transition hover:border-black/20"
      onClick={onActivate}
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] text-black/45">
          {label}
        </div>
        <div className="mt-[2px] truncate font-medium text-notion-black">
          {formatThemeInputValue(colorValue, "hex")}
        </div>
        <div className="truncate text-[10px] text-black/55">
          {formatThemeInputValue(colorValue, "rgba")}
        </div>
      </div>
      <span
        className="h-8 w-8 shrink-0 rounded-[8px] border border-black/10 shadow-inner"
        style={{ background: formatRgbaString(rgba) }}
      ></span>
    </button>
  );
};

export const WidgetThemeEditor = ({
  mode,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  suspendHoverReveal = false,
  paletteButtonClassName,
}: {
  mode: ThemeEditorMode;
  purchaseUrl?: string;
  suspendHoverReveal?: boolean;
  paletteButtonClassName?: string;
}) => {
  const { theme, saveTheme } = useWidgetTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeColorKey, setActiveColorKey] = useState<ThemeColorKey | null>(
    null
  );
  const [inputMode, setInputMode] = useState<ThemeInputMode>("hex");
  const [draftTheme, setDraftTheme] = useState<WidgetTheme>(theme);
  const [inputDraft, setInputDraft] = useState(
    formatThemeInputValue(theme.color1, "hex")
  );
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const locale = getBrowserLocale();
  const translations = getTranslationSet(locale);

  const resolvedActiveColorKey = activeColorKey ?? "color1";
  const activeRgba = useMemo(
    () =>
      parseWidgetThemeColor(draftTheme[resolvedActiveColorKey]) ?? defaultRgba,
    [draftTheme, resolvedActiveColorKey]
  );

  useEffect(() => {
    if (!isOpen) {
      setDraftTheme(theme);
      setActiveColorKey(null);
      setInputMode("hex");
      setInputDraft(formatThemeInputValue(theme.color1, "hex"));
    }
  }, [isOpen, theme]);

  useEffect(() => {
    setInputDraft(
      formatThemeInputValue(draftTheme[resolvedActiveColorKey], inputMode)
    );
  }, [draftTheme, inputMode, resolvedActiveColorKey]);

  useEffect(() => {
    if (!isOpen || activeColorKey == null) {
      return;
    }

    const pickerControls =
      pickerContainerRef.current?.querySelectorAll<HTMLElement>(
        ".react-colorful__interactive"
      ) ?? [];

    if (pickerControls.length < 3) {
      return;
    }

    pickerControls[0].setAttribute(
      "aria-label",
      translations.themeEditor.pickerColorLabel
    );
    pickerControls[1].setAttribute(
      "aria-label",
      translations.themeEditor.pickerHueLabel
    );
    pickerControls[2].setAttribute(
      "aria-label",
      translations.themeEditor.pickerOpacityLabel
    );
  }, [activeColorKey, isOpen, translations]);

  if (mode === "hidden") {
    return null;
  }

  const isLocked = mode === "locked";

  const updateThemeColor = (nextColor: string) => {
    setDraftTheme((current) => ({
      ...current,
      [resolvedActiveColorKey]: nextColor,
    }));
  };

  const updateActiveColorFromRgba = (value: RgbaColor) => {
    const rgbaValue = formatRgbaString({
      r: value.r,
      g: value.g,
      b: value.b,
      a: value.a ?? 1,
    });
    const normalized = normalizeThemeStorageColor(rgbaValue);

    if (!normalized) {
      return;
    }

    updateThemeColor(normalized);
  };

  const closeEditor = () => {
    setDraftTheme(theme);
    setActiveColorKey(null);
    setInputMode("hex");
    setInputDraft(formatThemeInputValue(theme.color1, "hex"));
    setIsOpen(false);
  };

  const paletteContents = (
    <>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-notion-black backdrop-blur">
        <Palette size={14} />
      </span>
      {isLocked && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-notion-black shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
          <Lock size={9} />
        </span>
      )}
    </>
  );

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute bottom-1 right-1 z-20 transition",
          isLocked ? "opacity-100" : "opacity-0",
          !isLocked && !suspendHoverReveal && "group-hover:opacity-100",
          isOpen && "opacity-100",
          paletteButtonClassName
        )}
      >
        {isLocked ? (
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]",
              "ring-1 ring-black/10"
            )}
            aria-label={translations.themeEditor.unlockAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {paletteContents}
          </a>
        ) : (
          <button
            type="button"
            className="pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]"
            aria-label={translations.themeEditor.openAriaLabel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              setDraftTheme(theme);
              setActiveColorKey(null);
              setInputMode("hex");
              setInputDraft(formatThemeInputValue(theme.color1, "hex"));
              setIsOpen(true);
            }}
          >
            {paletteContents}
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute top-1/2 bottom-1/2 translate-y-1/2  inset-0 z-30 flex items-center justify-center rounded-[inherit] bg-black/32"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            closeEditor();
          }}
        >
          <div
            className="w-full max-w-[300px] rounded-[8px] bg-white p-[8px] text-notion-black shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <div className="mb-[2px] flex items-center justify-between gap-[2px]">
              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                {activeColorKey != null && (
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-black/10 text-black/65"
                    aria-label={translations.themeEditor.backAriaLabel}
                    onClick={() => setActiveColorKey(null)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="font-sans text-xl leading-none">
                    {translations.themeEditor.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-black/10 text-black/65"
                aria-label={translations.themeEditor.closeAriaLabel}
                onClick={closeEditor}
              >
                <X size={16} />
              </button>
            </div>

            {activeColorKey == null ? (
              <div className="grid gap-[2px]">
                <p className="px-[2px] text-xs text-black/60">
                  {translations.themeEditor.instructions}
                </p>
                <ThemeColorField
                  label={translations.themeEditor.color1}
                  colorValue={draftTheme.color1}
                  onActivate={() => setActiveColorKey("color1")}
                />
                <ThemeColorField
                  label={translations.themeEditor.color2}
                  colorValue={draftTheme.color2}
                  onActivate={() => setActiveColorKey("color2")}
                />
              </div>
            ) : (
              <div className="grid gap-[2px]">
                <div className="grid gap-[2px]">
                  <div className="px-[2px] text-[10px] uppercase tracking-[0.16em] text-black/45">
                    {translations.themeEditor.pickerSummary}
                  </div>
                  <div ref={pickerContainerRef} className="widget-color-picker">
                    <RgbaColorPicker
                      color={activeRgba}
                      onChange={updateActiveColorFromRgba}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div className="flex rounded-[8px] border border-black/10 bg-[#f6f2ea] p-[2px]">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-[8px] px-[2px] py-[2px] text-sm font-medium transition",
                      inputMode === "hex"
                        ? "bg-notion-black text-white"
                        : "text-notion-black/70"
                    )}
                    onClick={() => setInputMode("hex")}
                  >
                    HEX
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-[8px] px-[2px] py-[2px] text-sm font-medium transition",
                      inputMode === "rgba"
                        ? "bg-notion-black text-white"
                        : "text-notion-black/70"
                    )}
                    onClick={() => setInputMode("rgba")}
                  >
                    RGBA
                  </button>
                </div>

                <label className="grid gap-[2px]">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-black/45">
                    {inputMode.toUpperCase()}
                  </span>
                  <input
                    value={inputDraft}
                    className="rounded-[8px] border border-black/10 bg-white px-[2px] py-[2px] text-sm"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setInputDraft(nextValue);
                      const normalized =
                        normalizeThemeStorageColor(nextValue);

                      if (normalized) {
                        updateThemeColor(normalized);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            <div className="mt-[2px] flex justify-end gap-[2px]">
              <button
                type="button"
                className="rounded-[8px] border border-black/10 px-[6px] py-[2px] text-sm font-medium text-notion-black"
                onClick={closeEditor}
              >
                {translations.themeEditor.cancel}
              </button>
              <button
                type="button"
                className="rounded-[8px] bg-notion-black px-[6px] py-[2px] text-sm font-medium text-white"
                onClick={() => {
                  saveTheme(draftTheme);
                  setIsOpen(false);
                }}
              >
                {translations.themeEditor.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
