type PlanInputOptions = 'title' | 'content' | 'complete' | 'type'
export type PlanInput = {
  [key in PlanInputOptions]?: string
}
