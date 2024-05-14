import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { Coupon } from "../models/coupon.js";
import { ErrorHandler } from "../utils/utilityClass.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) return next(new ErrorHandler("Please enter amount", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "usd",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { couponCode, amount } = req.body;

  if (!couponCode || !amount)
    return next(new ErrorHandler("Please Enter both Coupon and Discount", 400));
  await Coupon.create({
    couponCode,
    amount,
  });
  return res.status(201).json({
    success: true,
    message: `Coupon ${couponCode} Created Successfully`,
  });
});

export const getAllCoupon = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});
  return res.status(201).json({
    success: true,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);

  if (!coupon) return next(new ErrorHandler("Coupon Not Found", 400));
  await coupon.deleteOne();

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon.couponCode} Deleted Successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { couponCode } = req.query;

  const discount = await Coupon.findOne({ couponCode });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
  return res.status(201).json({
    success: true,
    discount: discount.amount,
  });
});

