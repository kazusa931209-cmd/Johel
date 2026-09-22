export const STUDIO_FLOATING_SURFACE_CLASS =
  "border border-border bg-surface shadow-lg backdrop-blur-md opacity-50 transition-[opacity,background-color,backdrop-filter] duration-200 hover:opacity-100 hover:bg-surface hover:backdrop-blur-none";

export const STUDIO_FAB_CLASS = [
  "flex h-14 w-14 cursor-pointer items-center justify-center rounded-full",
  STUDIO_FLOATING_SURFACE_CLASS,
].join(" ");
