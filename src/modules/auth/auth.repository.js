import RefreshToken from "./auth.schema.js";

export const createRefreshToken = (data, options = {}) =>
  RefreshToken.create([data], options).then((docs) => docs[0]);

export const findRefreshTokenByHash = (tokenHash) =>
  RefreshToken.findOne({ tokenHash, isRevoked: false });

export const revokeRefreshToken = (tokenHash, replacedByTokenHash = null) =>
  RefreshToken.findOneAndUpdate(
    { tokenHash },
    { isRevoked: true, replacedByTokenHash },
    { new: true },
  );

export const revokeAllUserRefreshTokens = (userId) =>
  RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
