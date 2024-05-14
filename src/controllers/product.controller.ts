import { Request } from "express";
import { TryCatch } from "../middlewares/error.middleware.js";
import {
  NewProductRequestBody,
  AllProductQuery,
  BaseQueryType,
} from "../types/types.js";
import { Product } from "../models/product.model.js";
import { ErrorHandler } from "../utils/utilityClass.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { InvalidateCache } from "../utils/features.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { stock, name, category, price } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Photo", 400));
    if (!stock || !name || !category || !price) {
      rm(photo.path, () => {
        console.log("Photo Deleted");
      });
      return next(new ErrorHandler("Please enter All Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });

    InvalidateCache({
      product: true,
      admin: true,
      orders: false,
    });
    return res
      .status(200)
      .json({ success: true, message: "Product Created Successfully" });
  },
);

export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products"))
    products = JSON.parse(myCache.get("latest-products") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(201).json({
    success: true,
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("all-categories"))
    categories = JSON.parse(myCache.get("all-categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("all-categories", JSON.stringify(categories));
  }

  return res.status(201).json({
    success: true,
    categories,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }
  return res.status(201).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  let { id } = req.params;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found", 400));
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  if (!product) return next(new ErrorHandler(`Product not found`, 400));

  return res.status(201).json({
    success: true,
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  const { name, price, stock, category } = req.body;

  if (!product) return next(new ErrorHandler("Product Not Found", 404));
  const photo = req.file;

  if (photo) {
    rm(product.photo!, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
  }
  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category;

  await product.save();
  InvalidateCache({
    product: true,
    orders: false,
    productId: String(product._id),
    admin: true,
  });
  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler(`Product not found`, 400));

  rm(product.photo, () => {
    console.log("Product deleted Successfully");
  });

  await product.deleteOne();

  InvalidateCache({
    product: true,
    orders: false,
    productId: String(product._id),
    admin: true,
  });

  return res.status(201).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, AllProductQuery>, res, next) => {
    const { price, category, search, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.Products_Page_limit) || 8;
    const skip = (page - 1) * limit;

    const BaseQuery: BaseQueryType = {};

    if (search)
      BaseQuery.name = {
        $regex: search,
        $options: "i",
      };
    if (price)
      BaseQuery.price = {
        $lte: Number(price),
      };
    if (category) BaseQuery.category = category;

    const productsPromise = Product.find(BaseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filterOnlyProducts] = await Promise.all([
      productsPromise,
      Product.find(BaseQuery),
    ]);

    const totalPage = Math.ceil(filterOnlyProducts.length / limit);

    return res.status(201).json({
      success: true,
      products,
      totalPage,
    });
  },
);
