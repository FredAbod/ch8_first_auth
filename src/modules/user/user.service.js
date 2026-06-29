import bcrypt from "bcryptjs";
import { AppError } from "../../shared/errors/AppError.js";
import { AuthProvider } from "../../shared/enums/authProvider.enum.js";
import { cacheDel, cacheGet, cacheSet } from "../../cache/cache.service.js";
import {
  createUser,
  findAllUsers,
  findUserByEmail,
  findUserById,
  findUserByOtp,
  updateUserById,
} from "./user.repository.js";
import { sendTemplateEmail } from "../email/email.service.js";
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshTokenByValue,
  signAccessToken,
} from "../auth/auth.service.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../upload/upload.service.js";
import { toPublicUser } from "./user.dto.js";
import { UserRole } from "../../shared/enums/userRole.enum.js";

const USER_PROFILE_CACHE_TTL = 300;
const userProfileCacheKey = (userId) => `user:profile:${userId}`;
const usersListCacheKey = "users:list";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const signUp = async ({ firstName, lastName, email, password }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists", 409, "DUPLICATE_USER");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const newUser = await createUser({
    firstName,
    lastName,
    email,
    otp,
    otpExpiry,
    password: hashedPassword,
    authProvider: AuthProvider.LOCAL,
  });

  sendTemplateEmail(email, "Email Verification", "signup", {
    firstName,
    lastName,
    otp,
  });

  return toPublicUser(newUser);
};

export const signIn = async ({ email, password }) => {
  const user = await findUserByEmail(email, true);
  if (!user) {
    throw new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS");
  }

  if (user.authProvider === AuthProvider.GOOGLE) {
    throw new AppError("Please sign in with Google", 400, "USE_GOOGLE_SIGNIN");
  }

  if (!user.password) {
    throw new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS");
  }

  if (!user.isVerified) {
    throw new AppError(
      "Please verify your email before signing in",
      400,
      "EMAIL_NOT_VERIFIED",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 400, "INVALID_CREDENTIALS");
  }

  const tokens = await issueTokenPair(user);

  return {
    user: toPublicUser(user),
    ...tokens,
  };
};

export const refreshSession = async ({ refreshToken }) => {
  const { userId, refreshToken: newRefreshToken } =
    await rotateRefreshToken(refreshToken);

  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const signOut = async ({ refreshToken }) => {
  await revokeRefreshTokenByValue(refreshToken);
};

export const verifyEmail = async ({ otp }) => {
  const user = await findUserByOtp(otp);
  if (!user) {
    throw new AppError("Invalid OTP", 400, "INVALID_OTP");
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError("OTP has expired", 400, "OTP_EXPIRED");
  }

  await updateUserById(user._id, {
    isVerified: true,
    $unset: { otp: 1, otpExpiry: 1 },
  });

  sendTemplateEmail(user.email, "Email Verified Successfully", "verify-email", {
    firstName: user.firstName,
  });
};

export const resendOtp = async ({ email }) => {
  const user = await findUserByEmail(email, true);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await updateUserById(user._id, { otp, otpExpiry });

  sendTemplateEmail(user.email, "Your New Verification Code", "resend-otp", {
    firstName: user.firstName,
    lastName: user.lastName,
    otp,
  });
};

export const makeAdmin = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const updatedUser = await updateUserById(userId, { role: UserRole.ADMIN });

  sendTemplateEmail(
    updatedUser.email,
    "You've Been Promoted to Admin",
    "makeadmin",
    { firstName: updatedUser.firstName, lastName: updatedUser.lastName },
  );

  await cacheDel(userProfileCacheKey(userId));
  await cacheDel(usersListCacheKey);

  return toPublicUser(updatedUser);
};

export const getAllUsers = async () => {
  const cached = await cacheGet(usersListCacheKey);
  if (cached) return cached;

  const users = await findAllUsers();
  const publicUsers = users.map(toPublicUser);
  await cacheSet(usersListCacheKey, publicUsers, USER_PROFILE_CACHE_TTL);
  return publicUsers;
};

export const getUserProfile = async (userId) => {
  const cacheKey = userProfileCacheKey(userId);
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const profile = toPublicUser(user);
  await cacheSet(cacheKey, profile, USER_PROFILE_CACHE_TTL);
  return profile;
};

export const editProfile = async (userId, { firstName, lastName, bio }, file) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const updates = {};
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (bio !== undefined) updates.bio = bio;

  if (file) {
    if (user.profilePicture) {
      const publicId = user.profilePicture.split("/").pop().split(".")[0];
      await deleteFromCloudinary(`demo/${publicId}`);
    }

    const fileName = `${userId}-${Date.now()}`;
    const uploadResult = await uploadToCloudinary(file.buffer, fileName);
    updates.profilePicture = uploadResult.secure_url;
  }

  const updatedUser = await updateUserById(userId, updates);

  await cacheDel(userProfileCacheKey(userId));
  await cacheDel(usersListCacheKey);

  return toPublicUser(updatedUser);
};
