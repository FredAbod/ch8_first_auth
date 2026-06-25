import User from "./user.schema.js";

export const findUserByEmail = (email, includeSecrets = false) => {
  let query = User.findOne({ email, deletedAt: null });
  if (includeSecrets) {
    query = query.select("+password +otp +otpExpiry");
  }
  return query;
};

export const findUserById = (id, includeSecrets = false) => {
  let query = User.findOne({ _id: id, deletedAt: null });
  if (includeSecrets) {
    query = query.select("+password +otp +otpExpiry");
  } else {
    query = query.select("-password");
  }
  return query;
};

export const findUserByOtp = (otp) =>
  User.findOne({ otp, deletedAt: null }).select("+otp +otpExpiry");

export const createUser = (data) => User.create(data);

export const updateUserById = (id, data) =>
  User.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).select(
    "-password",
  );

export const findAllUsers = () =>
  User.find({ deletedAt: null }).select("-password").lean();
