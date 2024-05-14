import { User } from "../models/user.model.js";
import { ErrorHandler } from "../utils/utilityClass.js";
import { TryCatch } from "./error.middleware.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  if (!id) return next(new ErrorHandler("Please Logged In", 401));
  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Please Enter Correct ID", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("You are not the admin.", 401));
  next();
});
