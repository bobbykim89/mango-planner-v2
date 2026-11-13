/** A fresh draft id for a plan that doesn't exist yet; each failed new plan gets its own (#30). */
export const newDraftKey = () => `new-${Date.now()}`

/** Whether a draft is for a new plan (rather than edits to an existing one). */
export const isNewDraft = (id: string) => id.startsWith('new-')
