import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import { validateEmail } from "../utils/validation/formatValidator.js";

import User from "../models/user.model.js";
import uploadOnCloudinary from "../services/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user's details
  //check whether the deatils have been provided
  //check whether the format of the deatils is correct
  //check whether the user already exists in the database
  //upload the files to the cloudinary
  //upload the files to the database
  //remove password and refresh token field from response
  //return res

  const { username, fullname, email, password } = req.body;

  console.log("req: ", { req });

  //cheking that fields are provided

  if (
    [username, fullname, email, password].some((field) => {
      field?.trim == "";
    })
  ) {
    throw new ApiError(
      (statusCode = 400),
      (message = "fieldsEmptyError: All the fields are required in the form")
    );
  }

  //checking the format of the email

  if (!validateEmail(email)) {
    throw new ApiError(
      (statusCode = 400),
      (message = "inputFormatError: Invalid email address")
    );
  }

  //checking if the user already exists

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(
      (statusCode = 409),
      (message = "UserAlreadyExistsError: User already exists")
    );
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  console.log("req.files.avatar: ", req.files.avatar);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: Avatar field is required to filled"
    );
  }

  if (!coverImageLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: CoverImage field is required to filled"
    );
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  console.log("avatar: ", avatar);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("coverImage: ", coverImage);

  const user = User.create({
    username: username.lowercase,
    fullname,
    email,
    password,
    coverImage: coverImage?.url || "",
    avatar: avatar?.url || "",
  });

  console.log("user: ", user);

  const createdUser = await User.fiendById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "registerError: Something went wrong file registering the user"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
