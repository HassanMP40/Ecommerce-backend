import express from "express";
import {
  applyDiscount,
  deleteCoupon,
  getAllCoupon,
  newCoupon,
  createPaymentIntent,
} from "../controllers/payment.controller.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const app = express.Router();

app.post("/create", createPaymentIntent);

app.get("/discount", applyDiscount);

app.route("/coupon/new").post(adminOnly, newCoupon);

app.route("/coupon/all").get(adminOnly, getAllCoupon);

app.route("/coupon/:id").delete(adminOnly, deleteCoupon);

export default app;
