import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlenght: 500,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        red: "Video",
        required: true,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Tweet = new mongoose.model("Tweet", playListSchema);
