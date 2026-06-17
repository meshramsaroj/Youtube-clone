import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updatedAvatarFile,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar", // fieldName
      maxCount: 1, // how many files want to receive
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured route
router.route("/logout").post(verifyJWTToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJWTToken, changePassword);
router
  .route("/update-avatar-image")
  .post(verifyJWTToken, upload.single("avatar"), updatedAvatarFile);

router.route("/update-user").put(verifyJWTToken, updateUserDetails);
router.route("/get-user-details").get(verifyJWTToken, getCurrentUser);

router.route("/test").get((req, res) => {
  console.log("test route hit");
  res.send("test route is working");
});

export default router;
