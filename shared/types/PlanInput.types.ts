type PlanInputStringOptions = 'title' | 'content' | 'type'
type PlanInputStringProp = {
  [key in PlanInputStringOptions]?: string
}
export interface PlanInput extends PlanInputStringProp {
  complete?: boolean
}
