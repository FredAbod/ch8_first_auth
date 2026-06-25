import { AppError } from "../errors/AppError.js";

export const validate = (schema, property = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join(". ");
    return next(new AppError(message, 400, "VALIDATION_ERROR"));
  }

  req[property] = value;
  return next();
};
