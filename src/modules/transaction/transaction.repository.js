import Transaction from "./transaction.schema.js";

export const createTransaction = (data, session = null) =>
  Transaction.create([data], session ? { session } : undefined).then(
    (docs) => docs[0],
  );

export const findTransactionByReference = (trxReference, session = null) => {
  const query = Transaction.findOne({ trxReference });
  return session ? query.session(session) : query;
};

export const updateTransactionByReference = (trxReference, data, session = null) => {
  const options = { new: true };
  if (session) options.session = session;
  return Transaction.findOneAndUpdate({ trxReference }, data, options);
};

export const findTransactionByIdempotencyKey = (idempotencyKey) =>
  Transaction.findOne({ idempotencyKey });
