export type AccentColor = "blue" | "rose" | "emerald" | "amber";

export const BORDER_STYLE = "rounded border-2 border-slate-900";
export const BORDER_STYLE_LIGHT = "rounded border-2 border-slate-300";
export const ACCENT_PALETTES = {
  blue: {
    bg: "bg-blue-600",
    bgSubtle: "bg-blue-100/80",
    hover: "hover:bg-blue-700",
    hoverSubtle: "hover:bg-blue-200/80",
    highlight: "data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
    focusRing: "focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600",
    text: "text-blue-700",
    textDark: "text-blue-900"
  },
  rose: {
    bg: "bg-rose-600",
    bgSubtle: "bg-rose-100/80",
    hover: "hover:bg-rose-700",
    hoverSubtle: "hover:bg-rose-200/80",
    highlight: "data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700",
    focusRing: "focus-within:ring-1 focus-within:ring-rose-600 focus-within:border-rose-600",
    text: "text-rose-700",
    textDark: "text-rose-900"
  },
  emerald: {
    bg: "bg-emerald-600",
    bgSubtle: "bg-emerald-100/80",
    hover: "hover:bg-emerald-700",
    hoverSubtle: "hover:bg-emerald-200/80",
    highlight: "data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-700",
    focusRing: "focus-within:ring-1 focus-within:ring-emerald-600 focus-within:border-emerald-600",
    text: "text-emerald-700",
    textDark: "text-emerald-900"
  },
  amber: {
    bg: "bg-amber-600",
    bgSubtle: "bg-amber-100/80",
    hover: "hover:bg-amber-700",
    hoverSubtle: "hover:bg-amber-200/80",
    highlight: "data-[highlighted]:bg-amber-50 data-[highlighted]:text-amber-700",
    focusRing: "focus-within:ring-1 focus-within:ring-amber-600 focus-within:border-amber-600",
    text: "text-amber-700",
    textDark: "text-amber-900"
  },
} as const;

export const PRESSED_ANIM = "transition-transform duration-200 active:scale-95";

export default {
  BORDER_STYLE,
  ACCENT_PALETTES,
  PRESSED_ANIM
}