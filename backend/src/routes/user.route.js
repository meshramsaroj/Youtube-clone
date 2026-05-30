import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/details").get((req, res) => {
  return res.send("Ok");
});

export default router;
