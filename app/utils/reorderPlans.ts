export type MoveTarget = 'up' | 'down' | 'top' | 'bottom'

/**
 * Returns a new array with the item at `from` moved to `target`.
 * Impossible moves (first item up/top, last item down/bottom, out-of-range
 * index) return an unchanged copy.
 */
export const reorderPlans = <T>(
  list: readonly T[],
  from: number,
  target: MoveTarget,
): T[] => {
  const next = [...list]
  if (from < 0 || from >= next.length) return next
  const to =
    target === 'up'
      ? from - 1
      : target === 'down'
        ? from + 1
        : target === 'top'
          ? 0
          : next.length - 1
  if (to < 0 || to >= next.length || to === from) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item as T)
  return next
}
