/** Platform-appropriate label for the global search keyboard shortcut. */
export function getSearchShortcutLabel(): string {
  if (typeof navigator === "undefined") {
    return "⌘K";
  }
  return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl+K";
}

/** Returns true when the event is the global search shortcut (⌘K / Ctrl+K). */
export function isGlobalSearchShortcut(event: KeyboardEvent): boolean {
  return (
    event.key.toLowerCase() === "k" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}
