import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(201).json({
    message: "registered",
  });
});

const getUserDetails = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: 'Ok'
    })
});

export { registerUser };
