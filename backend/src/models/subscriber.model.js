import mongoose, { Schema } from "mongoose";

const subscriberSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who will subscribe chanel
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom subscriber will subscribe
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriberSchema)
