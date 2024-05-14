import { NextFunction, Request, Response } from "express";

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response<any, Record<string, any>>>;

export type NewUserRequestBody = {
  _id: string;
  photo: string;
  name: string;
  email: string;
  gender: string;
  dob: Date;
};

export type NewProductRequestBody = {
  stock: number;
  name: string;
  price: number;
  category: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  country: string;
  state: string;
  pinCode: number;
};

export type OrderItemsType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type NewOrderRequestBody = {
  shippingInfo: ShippingInfoType;
  user: String;
  tax: number;
  discount: number;
  shippingCharges: number;
  subtotal: number;
  total: number;
  orderItems: OrderItemsType[];
};

export type AllProductQuery = {
  price?: string;
  sort?: string;
  category?: string;
  search?: string;
  page?: string;
};

export type BaseQueryType = {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
};

export type InvalidateCacheType = {
  product?: boolean;
  orders?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};
