import { profileInputDarkSchema, profileInputSchema } from '#shared/dto/profile'
import { Plan, Profile } from '#shared/models'
import type { H3Event } from 'h3'
import { BaseController } from '../base.controller'

export class ProfileController extends BaseController {
  public getCurrentProfile = async (e: H3Event) => {
    const user = await this.requireUser(e)
    return Profile.findOne({ user: user.id })
  }

  public createNewProfile = async (e: H3Event) => {
    const user = await this.requireUser(e)
    if (await Profile.exists({ user: user.id })) {
      throw apiError.PROFILE_EXISTS()
    }
    // existing plans start in their creation order
    const plans = await Plan.find({ author: user.id }).sort({ date: -1 })
    return new Profile({
      user: user.id,
      plansOrder: plans.map((plan) => plan.id),
    }).save()
  }

  public updateProfilePicture = async (e: H3Event) => {
    const user = await this.requireUser(e)
    const profile = await this.requireProfile(user.id)
    const file = await readImageUpload(e)
    const imageId = await uploadImage(file)
    const previous = profile.profilePicture
    const updated = await Profile.findByIdAndUpdate(
      profile.id,
      { profilePicture: imageId, updatedAt: new Date() },
      { returnDocument: 'after' },
    )
    if (previous) {
      // best effort: a stale image must not fail the request
      deleteCloudinaryImage(previous).catch((err) =>
        console.error('[cloudinary] failed to delete old image:', err),
      )
    }
    return updated
  }

  public updatePlansOrder = async (e: H3Event) => {
    const user = await this.requireUser(e)
    const profile = await this.requireProfile(user.id)
    const { plansOrder } = await this.validateBody(e, profileInputSchema)
    // keep only ids of the user's own plans, in the order given
    const owned = await Plan.find(
      { _id: { $in: plansOrder }, author: user.id },
      { _id: 1 },
    )
    const ownedIds = new Set(owned.map((plan) => plan.id as string))
    return Profile.findByIdAndUpdate(
      profile.id,
      {
        plansOrder: plansOrder.filter((id) => ownedIds.has(id)),
        updatedAt: new Date(),
      },
      { returnDocument: 'after' },
    )
  }

  public updateDarkMode = async (e: H3Event) => {
    const user = await this.requireUser(e)
    const profile = await this.requireProfile(user.id)
    const { dark } = await this.validateBody(e, profileInputDarkSchema)
    return Profile.findByIdAndUpdate(
      profile.id,
      { dark, updatedAt: new Date() },
      { returnDocument: 'after' },
    )
  }
}
