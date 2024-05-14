import express from "express";
import {
  getBarCharts,
  getDashboardStats,
  getLineChart,
  getPieCharts,
} from "../controllers/stats.controller.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const app = express.Router();

app.route("/stats").get(adminOnly ,getDashboardStats);

app.route("/pie").get(adminOnly ,getPieCharts);

app.route("/bar").get(adminOnly ,getBarCharts);

app.route("/line").get(adminOnly ,getLineChart);

export default app;
