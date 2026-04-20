import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Palette, X } from "lucide-react";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { useWidgetTheme } from "@/hook/useWidgetTheme";
import {
  formatRgbaString,
  formatThemeInputValue,
  normalizeThemeStorageColor,
  parseWidgetThemeColor,
  RgbaColorValue,
  ThemeInputMode,
  WidgetTheme,
} from "@/lib/widget-theme";

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
  hasLicense,
  suspendHoverReveal = false,
  paletteButtonClassName,
}: {
  hasLicense: boolean;
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

  if (!hasLicense) {
    return null;
  }

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

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute bottom-4 right-4 z-20 opacity-0 transition",
          !suspendHoverReveal && "group-hover:opacity-100",
          isOpen && "opacity-100",
          paletteButtonClassName
        )}
      >
        <button
          type="button"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-[conic-gradient(from_180deg_at_50%_50%,_#ff8a8a,_#ffd36f,_#8fe3ff,_#d29bff,_#ff8a8a)] shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-[1.02]"
          aria-label="Customize widget colors"
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
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-notion-black backdrop-blur">
            <Palette size={14} />
          </span>
        </button>
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
                    aria-label="Back to color list"
                    onClick={() => setActiveColorKey(null)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="font-sans text-xl leading-none">Choisir une couleur</h2>
                </div>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-black/10 text-black/65"
                aria-label="Close theme editor"
                onClick={closeEditor}
              >
                <X size={16} />
              </button>
            </div>

            {activeColorKey == null ? (
              <div className="grid gap-[2px]">
                <p className="px-[2px] text-xs text-black/60">
                  Choisis une couleur pour ouvrir son panneau d’édition.
                </p>
                <ThemeColorField
                  label="Color 1"
                  colorValue={draftTheme.color1}
                  onActivate={() => setActiveColorKey("color1")}
                />
                <ThemeColorField
                  label="Color 2"
                  colorValue={draftTheme.color2}
                  onActivate={() => setActiveColorKey("color2")}
                />
              </div>
            ) : (
              <div className="grid gap-[2px]">
                {/* <div className="rounded-[8px] border border-black/10 bg-[#f6f2ea] p-[2px]"> */}
                  <div className="widget-color-picker">
                    <RgbaColorPicker
                      color={activeRgba}
                      onChange={updateActiveColorFromRgba}
                      style={{ width: "100%" }}
                    />
                  {/* </div> */}
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
                Annuler
              </button>
              <button
                type="button"
                className="rounded-[8px] bg-notion-black px-[6px] py-[2px] text-sm font-medium text-white"
                onClick={() => {
                  saveTheme(draftTheme);
                  setIsOpen(false);
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
