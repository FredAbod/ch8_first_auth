import Joi from "joi";

export const signUpSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
});

export const verifyEmailSchema = Joi.object({
  otp: Joi.string().length(6).required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const editProfileSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  bio: Joi.string().trim().allow(""),
}).min(1);

export const userIdParamSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});
