import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWTToken = async (req, _, next) => {
  try {
    // access token from cookie
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // check token is not empty
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // decode token data
    const decodedTokenData = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedTokenData?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
};
