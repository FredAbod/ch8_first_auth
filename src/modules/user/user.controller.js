import { asyncHandler } from "../../shared/helpers/asyncHandler.js";
import { sendSuccess } from "../../shared/helpers/response.helper.js";
import * as userService from "./user.service.js";

export const signUp = asyncHandler(async (req, res) => {
  const user = await userService.signUp(req.body);
  return sendSuccess(res, 201, "User created successfully", { user });
});

export const signIn = asyncHandler(async (req, res) => {
  const result = await userService.signIn(req.body);
  return sendSuccess(res, 200, "User signed in successfully", result);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await userService.refreshSession(req.body);
  return sendSuccess(res, 200, "Token refreshed successfully", tokens);
});

export const signOut = asyncHandler(async (req, res) => {
  await userService.signOut(req.body);
  return sendSuccess(res, 200, "Signed out successfully", null);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await userService.verifyEmail(req.body);
  return sendSuccess(res, 200, "Email verified successfully", null);
});

export const resendOtp = asyncHandler(async (req, res) => {
  await userService.resendOtp(req.body);
  return sendSuccess(res, 200, "OTP resent successfully", null);
});

export const makeAdmin = asyncHandler(async (req, res) => {
  const user = await userService.makeAdmin(req.params.userId);
  return sendSuccess(res, 200, "User role updated to admin", { user });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return sendSuccess(res, 200, "Users retrieved successfully", { users });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user._id);
  return sendSuccess(res, 200, "Profile retrieved successfully", { user });
});

export const editProfile = asyncHandler(async (req, res) => {
  const user = await userService.editProfile(req.user._id, req.body, req.file);
  return sendSuccess(res, 200, "Profile updated successfully", { user });
});
