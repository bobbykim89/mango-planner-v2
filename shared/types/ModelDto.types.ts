import type { Types } from 'mongoose'
import type { PlanModel, ProfileModel, UserModel } from '../models'

// 1. Core simplification rules
type ToDto<T> = T extends Types.ObjectId
  ? string
  : T extends Date
  ? string
  : T extends (infer U)[]
  ? ToDto<U>[]
  : T extends object
  ? { [K in keyof T]: ToDto<T[K]> }
  : T

// 2. Special case for "populated or not" fields
type WithPopulate<T, DTO> = ToDto<T> | DTO

export type UserDto = ToDto<UserModel>

export type ProfileDto = Omit<ToDto<ProfileModel>, 'user'> & {
  user: WithPopulate<ProfileModel['user'], UserDto>
}

export type PlanDto = Omit<ToDto<PlanModel>, 'author'> & {
  author: WithPopulate<PlanModel['author'], UserDto>
  // author: UserDto
}
