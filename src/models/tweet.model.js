import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 280,
      trim: true,
    },
  },
  { timestamps: true }
);

tweetSchema.plugin(aggregatePaginate);

export const Tweet = new mongoose.model("Tweet", tweetSchema);
