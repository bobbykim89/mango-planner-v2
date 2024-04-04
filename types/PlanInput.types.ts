type PlanInputStringOptions = 'title' | 'content' | 'type'
type PlanInputStringProp = {
  [key in PlanInputStringOptions]?: string
}
// interface PlanInputReal extends PlanInputMew {
//   complete?: boolean
// }
// export type PlanInput = {
//   // [key in PlanInputOptions]?: string
//   title?: string
//   content?: string
//   type?: string
//   complete?: boolean
// }
export interface PlanInput extends PlanInputStringProp {
  complete?: boolean
}
