import { Schema, model } from "mongoose";

const planSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  complete: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export const Plan = model("plan", planSchema);
