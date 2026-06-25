import { Router } from "express";
import upload from "../../config/multer.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { authenticate, authorizeAdmin } from "../auth/auth.middleware.js";
import {
  refreshTokenSchema,
  signInSchema,
  signOutSchema,
} from "../auth/auth.validation.js";
import * as userController from "./user.controller.js";
import {
  editProfileSchema,
  resendOtpSchema,
  signUpSchema,
  userIdParamSchema,
  verifyEmailSchema,
} from "./user.validation.js";

const router = Router();

router.post("/signup", validate(signUpSchema), userController.signUp);
router.post("/signin", validate(signInSchema), userController.signIn);
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  userController.refreshToken,
);
router.post("/signout", validate(signOutSchema), userController.signOut);
router.patch("/verify-email", validate(verifyEmailSchema), userController.verifyEmail);
router.post("/resend-otp", validate(resendOtpSchema), userController.resendOtp);
router.patch(
  "/new-admin/:userId",
  authenticate,
  authorizeAdmin,
  validate(userIdParamSchema, "params"),
  userController.makeAdmin,
);
router.get("/all-users", authenticate, authorizeAdmin, userController.getAllUsers);
router.get("/profile", authenticate, userController.getProfile);
router.patch(
  "/edit-profile",
  authenticate,
  upload.single("profilePicture"),
  validate(editProfileSchema),
  userController.editProfile,
);

export default router;
