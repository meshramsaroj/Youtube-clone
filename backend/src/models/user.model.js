import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url,
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url,
    },
    watchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      rer: "Video",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      min: 7,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
