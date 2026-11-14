/**
 * After a list changes, the item that should have focus: the item itself if it's
 * still listed, else the nearest one after it (in the old order) that's still
 * listed, else the nearest one before it; null when nothing is left (#39).
 */
export const pickFocusId = (
  id: string,
  before: string[],
  after: string[],
): string | null => {
  if (after.includes(id)) return id
  const i = before.indexOf(id)
  const stillListed = (other: string) => after.includes(other)
  return (
    before.slice(i + 1).find(stillListed) ??
    before.slice(0, Math.max(i, 0)).reverse().find(stillListed) ??
    null
  )
}

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const isShown = (el: HTMLElement) =>
  el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null

/**
 * The element Tab (direction 1) or Shift+Tab (-1) would reach from `from`, in
 * document order; null at either end. For moving on from a closed popup (#41).
 */
export const nextTabbable = (
  from: HTMLElement,
  direction: 1 | -1,
  isVisible: (el: HTMLElement) => boolean = isShown,
): HTMLElement | null => {
  const all = Array.from(document.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => el === from || (el.tabIndex >= 0 && isVisible(el)),
  )
  return all[all.indexOf(from) + direction] ?? null
}
