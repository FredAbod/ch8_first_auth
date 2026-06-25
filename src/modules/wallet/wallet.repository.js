import Wallet from "./wallet.schema.js";

export const findWalletByUserAndCurrency = (userId, currency, session = null) => {
  const query = Wallet.findOne({ userId, currency });
  return session ? query.session(session) : query;
};

export const findWalletByAccountNumber = (accountNumber, session = null) => {
  const query = Wallet.findOne({ accountNumber });
  return session ? query.session(session) : query;
};

export const createWallet = (data, session = null) =>
  Wallet.create([data], session ? { session } : undefined).then((docs) => docs[0]);

export const incrementWalletBalance = (filter, amount, session = null) => {
  const options = { new: true };
  if (session) options.session = session;
  return Wallet.findOneAndUpdate(filter, { $inc: { balance: amount } }, options);
};

export const findWalletById = (walletId, session = null) => {
  const query = Wallet.findById(walletId);
  return session ? query.session(session) : query;
};
