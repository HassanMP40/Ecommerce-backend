import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    stock: {
      type: Number,
      required: [true, "PLease enter Stock"],
    },
    photo: {
      type: String,
      required: [true, "PLease add Photo"],
    },
    name: {
      type: String,
      required: [true, "PLease enter Name"],
    },

    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim: true,
    },
  },
  { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
