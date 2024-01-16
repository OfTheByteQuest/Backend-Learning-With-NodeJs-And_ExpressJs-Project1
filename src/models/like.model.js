import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: undefined,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    likedBy: {
      types: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tweet: {
      types: Schema.Types.ObjectId,
      ref: "Tweet",
      default: undefined,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
