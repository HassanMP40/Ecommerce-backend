import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: [true, "Please enter Coupon Code"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Please enter Discount"],
  },
});

export const Coupon = mongoose.model("Coupon", couponSchema);
