import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

// create password in encrypted form on save
userSchema.pre("save", async function (next) {
  if (!this.isModified(this.password)) return next(); // if password is not modified then don't call below lines of code
  this.password = bcrypt.hash(this.password, 10); // we replace existing password data with encrypted password which is done by bcrypt.hash method. this method works like (variable name, encryption key/ or round)
  next();
});

// check password whether it is correct or now by decrypting the same
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//generate access token
userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      // data which needs to be send to token to access it on browser
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// generate refresh token
userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
