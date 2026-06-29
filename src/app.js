import express from "express";
import morgan from "morgan";
import applySecurityMiddleware from "./shared/middlewares/security.middleware.js";
import notFoundMiddleware from "./shared/middlewares/notFound.middleware.js";
import errorMiddleware from "./shared/middlewares/error.middleware.js";
import userRoutes from "./modules/user/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import { sendSuccess } from "./shared/helpers/response.helper.js";

const app = express();

applySecurityMiddleware(app);
app.use(morgan("dev"));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) =>
  sendSuccess(res, 200, "API is running", null),
);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
