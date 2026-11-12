import { planInputCompleteSchema, planInputSchema } from '#shared/dto/plan'
import { Plan, Profile } from '#shared/models'
import { getRouterParam, type H3Event } from 'h3'
import { BaseController } from '../base.controller'

export class PlanController extends BaseController {
  public getAllPostByUser = async (e: H3Event) => {
    return Plan.find({ author: e.context.user.id }).sort({ updatedAt: -1 })
  }

  public createNewPlan = async (e: H3Event) => {
    const user = await this.requireUser(e)
    const { title, content, type } = await this.validateBody(e, planInputSchema)
    const plan = await new Plan({
      title,
      content,
      type,
      author: user.id,
    }).save()
    // new plans go to the top of the user's custom order
    await Profile.updateOne(
      { user: user.id },
      { $push: { plansOrder: { $each: [plan.id], $position: 0 } } },
    )
    return plan
  }

  public updatePlan = async (e: H3Event) => {
    const plan = await this.findOwnedPlan(
      getRouterParam(e, 'id'),
      e.context.user.id,
    )
    const body = await this.validateBody(e, planInputSchema)
    return Plan.findByIdAndUpdate(
      plan.id,
      { ...body, updatedAt: new Date() },
      { returnDocument: 'after' },
    )
  }

  public togglePlanCompleteById = async (e: H3Event) => {
    const plan = await this.findOwnedPlan(
      getRouterParam(e, 'id'),
      e.context.user.id,
    )
    const body = await this.validateBody(e, planInputCompleteSchema)
    return Plan.findByIdAndUpdate(
      plan.id,
      { ...body, updatedAt: new Date() },
      { returnDocument: 'after' },
    )
  }

  public deletePlanById = async (e: H3Event) => {
    const plan = await this.findOwnedPlan(
      getRouterParam(e, 'id'),
      e.context.user.id,
    )
    await plan.deleteOne()
    await Profile.updateOne(
      { user: e.context.user.id },
      { $pull: { plansOrder: plan.id } },
    )
    return { id: plan.id as string }
  }
}
