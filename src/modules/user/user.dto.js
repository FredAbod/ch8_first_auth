export const toPublicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  authProvider: user.authProvider,
  phoneNumber: user.phoneNumber,
  bio: user.bio,
  profilePicture: user.profilePicture,
});
