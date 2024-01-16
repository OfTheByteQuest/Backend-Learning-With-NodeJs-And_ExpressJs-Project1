import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      // One way of defining filed as an object
      //url: {
      //   type: String,
      //   required: true,
      // },
      // publicId: {
      //   type: String,
      //   required: true,
      // },

      type: {
        url: String,
        publicId: String,
      },
    },
    thumbnail: {
      type: {
        url: String,
        publicId: String,
      },
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: String,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(aggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
