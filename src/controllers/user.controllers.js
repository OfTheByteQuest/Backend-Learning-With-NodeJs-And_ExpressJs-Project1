import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { validateEmail } from "../utils/validation/formatValidator.js";

import { User } from "../models/user.model.js";
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

  const { userName, fullName, email, password } = req.body;

  console.log(userName, fullName, email, password);

  console.log("req.body: ", req.body);

  //cheking that fields are provided

  if (
    [userName, fullName, email, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(
      400,
      "fieldsEmptyError: All the fields are required in the form"
    );
  }

  //checking the format of the email

  // if (!validateEmail(email)) {
  //   throw new ApiError(400, "inputFormatError: Invalid email address");
  // }

  //checking if the user already exists

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "UserAlreadyExistsError: User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  console.log("req.files.avatar: ", req.files.avatar);
  console.log("avatarLocalPath: ", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: Avatar field is required to filled"
    );
  }

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  console.log("req.files.coverImage: ", req.files.coverImage);
  console.log("coverImageLocalPath: ", coverImageLocalPath);

  if (!coverImageLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: CoverImage field is required to filled"
    );
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("avatar: ", avatar);
  console.log("coverImage: ", coverImage);

  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    coverImage: coverImage?.url || "",
    avatar: avatar?.url || "",
  });

  console.log("user: ", user);

  const createdUser = await User.findById(user._id).select(
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
