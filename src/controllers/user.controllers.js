import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// import { validateEmail } from "../utils/validation/formatValidator.js";

import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../services/cloudinary.js";

const generateAccessAndRefreshTokens = async (user) => {
  //Instead of taking user._id we are taking user object

  try {
    const accessToken = user.generateAcessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      500,
      "tokenGenerationError: Something went wrong during token generation"
    );
  }
};

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

  // console.log(userName, fullName, email, password);

  // console.log("req.body: ", req.body);

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

  // console.log("req.files.avatar: ", req.files.avatar);
  // console.log("avatarLocalPath: ", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: Avatar field is required to filled"
    );
  }

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // console.log("req.files.coverImage: ", req.files.coverImage);
  // console.log("coverImageLocalPath: ", coverImageLocalPath);

  if (!coverImageLocalPath) {
    throw new ApiError(
      400,
      "fieldsEmptyError: CoverImage field is required to filled"
    );
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // console.log("avatar: ", avatar);
  // console.log("coverImage: ", coverImage);

  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    coverImage: coverImage?.url || "",
    avatar: avatar?.url || "",
  });

  // console.log("user: ", user);

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

const loginUser = asyncHandler(async (req, res) => {
  //Take user details from body
  //Check whether user is registered or not
  //Match the password thorugh user document method
  //Generate the JWT token
  //Set the tokens through cookies

  const { userName, password, email } = req.body;

  console.log("req.body: ", req.body);

  console.log("userName: ", userName);
  console.log("email: ", email);
  console.log("password: ", password);

  if (!(email || password) && !password) {
    throw new Error(
      400,
      "fieldsEmptyError: Required fields have not been provided"
    );
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new Error(400, "UserDoesNotExistError: User is not registered");
  }

  const isPasswordValid = user.isPasswrodCorrect(password);

  if (!isPasswordValid) {
    throw new Error(
      401,
      "passwordMissmatchError: Entered password is incorrect"
    );
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    secure: true,
    httpOnly: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User has been logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //get the access token from the user
  //destructure for the user._id
  //match the user through the database
  //update 'refreshToken' and 'accessToken' properties in the database
  //delete the 'accessToken' and 'refreshToken' cookies

  const user = req.user;

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accesToken", options)
    .cookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "logOutSuccess: User has been logged out successfully"
      )
    );
});

export { registerUser, loginUser, logoutUser };
