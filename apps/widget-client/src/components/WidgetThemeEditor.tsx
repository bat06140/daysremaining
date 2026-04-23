import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, Palette } from "lucide-react";
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
  const rgba = parseWidgetThemeColor(colorValue) ?? defaultRgba;
  const isLockedVariant = variant === "locked";

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-black/42">
            {label}
          </div>
          {isLockedVariant && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/8 bg-white/80 text-black/55 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              <Lock size={10} />
            </span>
          )}
        </div>
        <div className="mt-[5px] truncate text-[14px] font-semibold leading-none text-notion-black">
          {formatThemeInputValue(colorValue, "hex")}
        </div>
        <div className="mt-[4px] truncate text-[10px] text-black/58">
          {formatThemeInputValue(colorValue, "rgba")}
        </div>
      </div>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-black/10 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <span
          className="absolute inset-[3px] rounded-[8px] border border-black/6"
          style={{ background: formatRgbaString(rgba) }}
        ></span>
      </span>
    </>
  );

  const baseClassName = cn(
    "group flex min-w-0 items-center justify-between gap-[10px] rounded-[10px] border px-[10px] py-[9px] text-left transition",
    isLockedVariant
      ? "border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,241,236,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_18px_rgba(55,53,47,0.08)] hover:border-black/20"
      : "border-black/10 bg-white/92 hover:border-black/20",
  );

  if (isLockedVariant && purchaseUrl) {
    return (
      <a
        data-theme-editor-card="locked"
        href={purchaseUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={lockLabel}
        className={baseClassName}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      data-theme-editor-card="editable"
      type="button"
      className={baseClassName}
      onClick={onActivate}
    >
      {content}
    </button>
  );
};

export const WidgetThemeEditor = ({
  mode,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
  suspendHoverReveal = false,
  paletteButtonClassName,
  initialOpen = false,
  initialActiveColorKey = null,
}: {
  mode: ThemeEditorMode;
  purchaseUrl?: string;
  suspendHoverReveal?: boolean;
  paletteButtonClassName?: string;
  initialOpen?: boolean;
  initialActiveColorKey?: ThemeColorKey | null;
}) => {
  const { theme, saveTheme } = useWidgetTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeColorKey, setActiveColorKey] = useState<ThemeColorKey | null>(
    initialActiveColorKey,
  );
  const [inputMode, setInputMode] = useState<ThemeInputMode>("hex");
  const [inputDraft, setInputDraft] = useState(
    formatThemeInputValue(theme.color1, "hex"),
  );
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const locale = getBrowserLocale();
  const translations = getTranslationSet(locale);

  const resolvedActiveColorKey = activeColorKey ?? "color1";
  const activeRgba = useMemo(
    () => parseWidgetThemeColor(theme[resolvedActiveColorKey]) ?? defaultRgba,
    [theme, resolvedActiveColorKey],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveColorKey(null);
      setInputMode("hex");
      setInputDraft(formatThemeInputValue(theme.color1, "hex"));
    }
  }, [isOpen, theme]);

  useEffect(() => {
    setInputDraft(
      formatThemeInputValue(theme[resolvedActiveColorKey], inputMode),
    );
  }, [theme, inputMode, resolvedActiveColorKey]);

  useEffect(() => {
    if (!isOpen || activeColorKey == null) {
      return;
    }

    const pickerControls =
      pickerContainerRef.current?.querySelectorAll<HTMLElement>(
        ".react-colorful__interactive",
      ) ?? [];

    if (pickerControls.length < 3) {
      return;
    }

    pickerControls[0].setAttribute(
      "aria-label",
      translations.themeEditor.pickerColorLabel,
    );
    pickerControls[1].setAttribute(
      "aria-label",
      translations.themeEditor.pickerHueLabel,
    );
    pickerControls[2].setAttribute(
      "aria-label",
      translations.themeEditor.pickerOpacityLabel,
    );
  }, [activeColorKey, isOpen, translations]);

  if (mode === "hidden") {
    return null;
  }

  const isLocked = mode === "locked";
  const isFreemium = mode === "freemium";
  const canEditColors = mode === "premium";
  const showDetailStep = canEditColors && activeColorKey != null;

  const updateThemeColor = (nextColor: string) => {
    saveTheme({
      ...theme,
      [resolvedActiveColorKey]: nextColor,
    });
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
          paletteButtonClassName,
        )}
      >
        {isLocked ? (
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "pointer-events-auto relative flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]",
              "ring-1 ring-black/10",
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
          data-theme-editor-overlay="true"
          className="absolute inset-0 z-30 rounded-[inherit] bg-black/12 animate-in fade-in duration-200"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            closeEditor();
          }}
        >
          <div
            data-theme-editor-panel="true"
            className={cn(
              "absolute bottom-1 right-1 origin-bottom-right overflow-hidden rounded-[12px] bg-white/98 p-[8px] text-notion-black shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/10 animate-in fade-in zoom-in-95 slide-in-from-bottom-1 slide-in-from-right-1 duration-200 transition-[width,height,opacity,transform] ease-out",
              !showDetailStep
                ? "h-[170px] w-[180px] scale-100 opacity-100"
                : "h-[308px] w-[224px] scale-100 opacity-100",
            )}
            style={{
              maxWidth: "calc(100% - 8px)",
              maxHeight: "calc(100% - 8px)",
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {!showDetailStep ? (
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
              <div className="grid h-full content-start gap-[8px] transition-opacity duration-150">
                <div className="flex items-center gap-[4px]">
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-black/10 text-black/65 transition hover:border-black/20"
                    aria-label={translations.themeEditor.backAriaLabel}
                    onClick={() => setActiveColorKey(null)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center gap-[4px]">
                    <div className="flex h-9 min-w-0 flex-1 rounded-[8px] border border-black/10 bg-white/90 p-[2px]">
                      <button
                        type="button"
                        className={cn(
                          "h-full flex-1 rounded-[6px] px-[6px] py-[2px] text-xs font-medium transition",
                          inputMode === "hex"
                            ? "bg-notion-black text-white"
                            : "text-notion-black/70",
                        )}
                        onClick={() => setInputMode("hex")}
                      >
                        HEX
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "h-full flex-1 rounded-[6px] px-[6px] py-[2px] text-xs font-medium transition",
                          inputMode === "rgba"
                            ? "bg-notion-black text-white"
                            : "text-notion-black/70",
                        )}
                        onClick={() => setInputMode("rgba")}
                      >
                        RGBA
                      </button>
                    </div>
                  </div>
                </div>

                <label className="grid gap-[2px]">
                  <input
                    value={inputDraft}
                    className="rounded-[8px] border border-black/10 bg-white px-[8px] py-[8px] text-sm"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setInputDraft(nextValue);
                      const normalized = normalizeThemeStorageColor(nextValue);

                      if (normalized) {
                        updateThemeColor(normalized);
                      }
                    }}
                  />
                </label>

                <div ref={pickerContainerRef} className="widget-color-picker">
                  <RgbaColorPicker
                    color={activeRgba}
                    onChange={updateActiveColorFromRgba}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
