import express from "express";
import { DBConnect } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import bodyParser from "body-parser";
import NodeCache from "node-cache";
import morgan from "morgan";
import { config } from "dotenv";
import Stripe from "stripe";
import cors from "cors";

const app = express();

config({
  path: "./.env",
});

const port = process.env.PORT || 5000;
const MongoDBUri = process.env.MONGODB_DB_URL || "";
const stripeKey = process.env.STRIPE_KEY || "";

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();
DBConnect(MongoDBUri);
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Api Working with /api/v1");
});

// Importing Routes
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import paymentRoutes from "./routes/payment.route.js";
import dashboardRoutes from "./routes/stats.route.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
