import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

const getAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw ApiError(404, "Access and Refresh token generation is failed");
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // take data from client ex: req.body
  const { username, email, password } = req.body;

  // check values are not empty
  if (!username && !email) {
    res
      .status(400)
      .json(new ApiResponse(400, null, "Username or Email is required"));
  }

  if (!username && !password) {
    res
      .status(400)
      .json(new ApiResponse(400, null, "Username and Password is required"));
  }

  // check user exist or not
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    res
      .status(404)
      .json(new ApiResponse(404, null, `User not found with Email :${email}`));
  }

  //check password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    res
      .status(401)
      .json(new ApiResponse(401, null, `Invalid user credentials`));
  }
  // access token and refresh token
  const { accessToken, refreshToken } = await getAccessAndRefreshToken(
    user._id
  );
  // remove password and refresh token and send rest of the logged in data

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // return res and send secure cookie
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Delete refreshToken from database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this removed the field document
      },
    },
    { new: true }
  );

  // Clear cookie and return response

  return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get encoded refresh token from cookies
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await getAccessAndRefreshToken(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  // Take old and new password from user
  // check user is logedin or not this will be handled by middleware
  // find user by id
  //check old password is correct or not
  // get user details by id and update password

  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword && newPassword)) {
    throw new ApiError(401, "Old and New password required");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const updatedAvatarFile = asyncHandler(async (req, res) => {
  // get local file path from user
  // check file path is not empty
  // upload on cloudinary and get updated local file path url
  //if url present then replace with existing user avatar url and save it
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadFileOnCloudinary(localAvatarPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Failed while uploading on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Avatar image updated successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "Fullname and Email is missing");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true } // it returns the updated info
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User details updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        "Current user data fetched successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(404, `Username: ${username} not exist`);
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // this db name of Subscription
        localField: "_id",
        foreignField: "channel", // fetching from chanel object of Subscription model
        as: "subscribers", // variable name
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // from subscriber object of Subscription model
        as: "subscribedTo", // variable name
      },
    },
    {
      // Additional fields which we want to send to user using $addFields operator
      $addFields: {
        subscriberCount: {
          $size: "$subscribers", // this will return count of subscriber object which we define in line no 332
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo", // this will return count of subscribedTo object which we define in line no 340
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // we are checking user id is exist in subscriber array or not using $in operator
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // With the help of $project operator we combine additional field dat with existing user data
      $project: {
        username: 1, // 1 is refer to flag
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1, // this is additional details which we are sending along with user schema
        channelSubscribedToCount: 1,
        subscriberCount: 1,
      },
    },
  ]);

  console.log("channel:", channel);

  if (!channel.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channel: channel[0] },
        "Channel details fetched successfully"
      )
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watched history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  updatedAvatarFile,
  updateUserDetails,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
};
