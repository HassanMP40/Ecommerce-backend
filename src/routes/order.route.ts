import express from "express";
import {
  deleteOrder,
  getAllOrders,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.controller.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const app = express.Router();

app.route("/new").post(newOrder);

app.route("/my").get(myOrders);

app.route("/all").get(adminOnly, getAllOrders);

app.route("/:id").get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);

export default app;
    