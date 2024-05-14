import express from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
  getAllProducts,
} from "../controllers/product.controller.js";
import { SingleUpload } from "../middlewares/multer.middleware.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const app = express.Router();

app.route("/new").post(adminOnly, SingleUpload, newProduct);

app.route("/all").get(getAllProducts);

app.route("/latest").get(getLatestProducts);

app.route("/categories").get(getAllCategories);

app.route("/admin-products").get(adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .delete(adminOnly, deleteProduct)
  .put(adminOnly, SingleUpload, updateProduct);

export default app;
