import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const healthCheck = asyncHandler(async (req, res) => {
  if (!req) {
    throw new ApiError(
      400,
      "request object is missing in the healthcheck file"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Everything is fine; good to go 🤝"));
});

export { healthCheck };
