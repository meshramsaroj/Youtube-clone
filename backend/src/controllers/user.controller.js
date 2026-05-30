import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //Get details from client as per userSchema
  const body = req.body;
  const { username, email, fullName, avatar, coverImage, password } = body;
  
  //validate: check if data is empty or not
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check user is already exist or not based on email, or username
  //const foundUser = User.find((user) => user.email === email); approach 1
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          null,
          `User already exist with this email: ${email} and username: ${username}`
        )
      );
  }

  // check files are received or not like image file for avatar
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // check file is uploaded on cloudinary and received url from it
  const uploadedAvatarFileResponse =
    await uploadFileOnCloudinary(avatarLocalFilePath);
  const uploadedCoverImageFileResponse = await uploadFileOnCloudinary(
    coverImageLocalFilePath
  );

  if (!uploadedAvatarFileResponse) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create a payload object to create record in db
  const newUser = {
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: uploadedAvatarFileResponse.url,
    coverImage: uploadedCoverImageFileResponse?.url || "",
    password,
  };

  const user = await User.create(newUser);

  //remove password and refresh token from payload object
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check user is created or not
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Ok",
  });
});

export { registerUser };
