import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { InvalidateCacheType, OrderItemsType } from "../types/types.js";

export const DBConnect = (MongoDBUri: string) =>
  mongoose
    .connect(MongoDBUri, {
      dbName: "Ecommerce_App",
    })
    .then((c) => console.log(`DB Connected to ${c.connection.name}`))
    .catch((err) => console.log(err));

export const InvalidateCache = ({
  product,
  orders,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheType) => {
  if (product) {
    const deleteProduct: string[] = [
      "latest-products",
      "all-categories",
      "all-products",
    ];
    if (typeof productId === "string")
      deleteProduct.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => deleteProduct.push(`product-${i}`));

    myCache.del(deleteProduct);
  }
  if (orders) {
    const deleteOrder: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `single-order-${orderId}`,
    ];

    myCache.del(deleteOrder);
  }
  if (admin) {
    const deleteAdmin: string[] = [
      "admin-stats",
      "admin-pie-chart",
      "admin-bar-chart",
      "admin-line-chart",
    ];

    myCache.del(deleteAdmin);
  }
};

export const reduceStock = async (orderItems: OrderItemsType[]) => {
  orderItems.forEach(async (order) => {
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  });
};

export const calculatePercentAge = (
  currentMonth: number,
  prevMonth: number,
) => {
  if (prevMonth === 0) return currentMonth * 100;
  const percent = ((currentMonth - prevMonth) / prevMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  productCategories,
  productCount,
}: {
  productCategories: string[];
  productCount: number;
}) => {
  const categoriesCount = await Promise.all(
    productCategories.map((category) => Product.countDocuments({ category })),
  );

  return productCategories.map((category, i) => ({
    [category]: Math.round((categoriesCount[i] / productCount) * 100),
  }));
};
