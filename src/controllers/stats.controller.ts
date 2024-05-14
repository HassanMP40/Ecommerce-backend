import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.middleware.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { calculatePercentAge, getInventories } from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  let key = "admin-stats";

  if (myCache.has(key)) {
    stats = JSON.parse(myCache.get(key) as string);
  } else {
    let today = new Date();

    let sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const currentMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const prevMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const currentMonthProductsPromise = Product.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const prevMonthProductsPromise = Product.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const currentMonthUsersPromise = User.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const prevMonthUsersPromise = User.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const currentMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    const prevMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: prevMonth.start,
        $lte: prevMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

    const [
      currentMonthProducts,
      currentMonthUsers,
      currentMonthOrders,
      prevMonthProducts,
      prevMonthUsers,
      prevMonthOrders,
      productCount,
      userCount,
      allOrder,
      lastSixMonthOrders,
      productCategories,
      femaleCount,
      transaction,
    ] = await Promise.all([
      currentMonthProductsPromise,
      currentMonthUsersPromise,
      currentMonthOrdersPromise,
      prevMonthProductsPromise,
      prevMonthUsersPromise,
      prevMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.find({}).distinct("category"),
      User.countDocuments({ gender: "female" }),
      Order.find({})
        .select(["id", "orderItems", "discount", "total", "status"])
        .limit(4),
    ]);

    let currentMonthRevenue = 0;
    currentMonthOrders.forEach(
      (order) => (currentMonthRevenue += order.total || 0),
    );

    const prevMonthRevenue = prevMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0,
    );

    const revenue = allOrder.reduce((total, order) => total + order.total, 0);

    // Pichle chhe mahinon ke counts aur revenue ko store karne ke liye arrays ko initialize karo
    let OrderMonthCount = Array(6).fill(0); // Har mahine ke orders ka count store karne ke liye ek array banaya gaya hai. Is array mein har index ko shuruwat mein 0 se fill kiya gaya hai.
    let OrderMonthRevenue = Array(6).fill(0); // Har mahine ke total revenue ko store karne ke liye ek array banaya gaya hai. Is array mein har index ko shuruwat mein 0 se fill kiya gaya hai.

    // Har order ke liye pichle chhe mahinon mein loop chalao
    lastSixMonthOrders.forEach((order) => {
      // Order ki creation date ko hasil karo
      const createdAt = order.createdAt;

      // Abhi current month aur order ki creation month ke darmiyan ke mahinon ka farq nikalo
      // % 12 is liye kiya gaya hai taake result hamesha 0 aur 11 ke darmiyan hi rahe (saal ke 12 mahine)
      const monthDiff = (today.getMonth() - createdAt.getMonth() + 12) % 12;

      // Check karo ke kya order pichle chhe mahinon mein create hua hai
      if (monthDiff < 6) {
        // Agar order pichle chhe mahinon mein create hua hai, to us mahine ke count aur revenue ko update karo
        // Arrays mein monthDiff ko sahi index mein map karne ke liye 6 se monthDiff ko subtract karo
        OrderMonthCount[6 - monthDiff - 1] += 1; // Har mahine ke count ko update karne ke liye, 'OrderMonthCount' array ke sahi index par 1 ko add kiya gaya hai.
        OrderMonthRevenue[6 - monthDiff - 1] += order.total; // Har mahine ka revenue update karne ke liye, 'OrderMonthRevenue' array ke sahi index par order ka total amount add kiya gaya hai.
      }
    });

    let inventory = await getInventories({
      productCategories,
      productCount,
    });
    const latestTransactions = transaction.map((transaction) => ({
      _id: transaction._id,
      quantity: transaction.orderItems.map((i) => i.quantity),
      discount: transaction.discount,
      amount: transaction.total,
      status: transaction.status,
    }));
    const userRatio = {
      male: userCount - femaleCount,
      female: femaleCount,
    };
    const chart = {
      OrderMonthCount,
      OrderMonthRevenue,
    };
    const changePercent = {
      revenue: calculatePercentAge(currentMonthRevenue, prevMonthRevenue),
      product: calculatePercentAge(
        currentMonthProducts.length,
        prevMonthProducts.length,
      ),
      user: calculatePercentAge(
        currentMonthUsers.length,
        prevMonthUsers.length,
      ),
      order: calculatePercentAge(
        currentMonthOrders.length,
        prevMonthOrders.length,
      ),
    };
    const count = {
      revenue,
      product: productCount,
      user: userCount,
      order: allOrder.length,
    };

    stats = {
      latestTransactions,
      userRatio,
      inventory,
      chart,
      count,
      changePercent,
    };
    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts = {};
  let key = "admin-pie-chart";
  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const allOrdersPromise = Order.find({}).select([
      "total",
      "subTotal",
      "tax",
      "shippingCharges",
      "discount",
    ]);
    const [
      ordersProcessing,
      ordersShipped,
      ordersDelivered,
      productCategories,
      productCount,
      outOfStock,
      allOrders,
      user,
      adminCount,
      customerCount,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.find({}).distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0,
    );

    let discount = 0;
    allOrders.forEach((order) => (discount += order.discount || 0));

    const burnt = allOrders.reduce(
      (total, order) => total + (order.shippingCharges || 0),
      0,
    );

    let productionCost = 0;
    allOrders.forEach((order) => (productionCost += order.tax || 0));
    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin = grossIncome - discount - burnt - productionCost;

    const userAge = {
      teen: user.filter((user) => user.age < 18).length,
      adult: user.filter((user) => user.age >= 18 && user.age <= 40).length,
      old: user.filter((user) => user.age >= 40).length,
    };

    const role = {
      admin: adminCount,
      customer: customerCount,
    };

    const revenueDistribution = {
      netMargin,
      discount,
      burnt,
      productionCost,
      marketingCost,
    };

    const stockAvailability = {
      inStock: productCount - outOfStock,
      outOfStock,
    };

    const inventory = await getInventories({ productCategories, productCount });
    const status = {
      processing: ordersProcessing,
      shipped: ordersShipped,
      delivered: ordersDelivered,
    };

    charts = {
      userAge,
      role,
      revenueDistribution,
      stockAvailability,
      inventory,
      status,
    };
    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  let key = "admin-bar-chart";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    let today = new Date();
    let sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
    let twalveMonthAgo = new Date();
    twalveMonthAgo.setMonth(twalveMonthAgo.getMonth() - 12);

    const productPromise = Product.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const userPromise = User.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const orderPromise = Order.find({
      createdAt: {
        $gte: twalveMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      productPromise,
      userPromise,
      orderPromise,
    ]);

    let productMonthCount: number[] = Array(6).fill(0);
    products.forEach((product) => {
      const created = product.createdAt;
      const monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        productMonthCount[6 - monthDiff - 1] += 1;
      }
    });

    let userMonthCount: number[] = Array(6).fill(0);
    users.forEach((user) => {
      const created = user.createdAt;
      const monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        userMonthCount[6 - monthDiff - 1] += 1;
      }
    });
    let orderMonthCount: number[] = Array(12).fill(0);
    orders.map((order) => {
      let created = order.createdAt;
      let monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 12) {
        orderMonthCount[12 - monthDiff - 1] += 1;
      }
    });

    charts = {
      productMonthCount,
      userMonthCount,
      orderMonthCount,
    };
    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineChart = TryCatch(async (req, res, next) => {
  let charts;
  let key = "admin-line-chart";
  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    let today = new Date();
    let twalveMonthAgo = new Date();
    twalveMonthAgo.setMonth(twalveMonthAgo.getMonth() - 12);
    const productPromise = Product.find({
      createdAt: {
        $gte: twalveMonthAgo,
        $lte: today,
      },
    }).select("createdAt");
    const userPromise = User.find({
      createdAt: {
        $gte: twalveMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const revenuePromise = Order.find({
      createdAt: {
        $gte: twalveMonthAgo,
        $lte: today,
      },
    }).select(["createdAt", "total", "discount"]);

    const [products, users, orders] = await Promise.all([
      productPromise,
      userPromise,
      revenuePromise,
    ]);

    let productCount: number[] = Array(12).fill(0);
    products.forEach((product) => {
      let created = product.createdAt;
      let monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 12) {
        productCount[12 - monthDiff - 1] += 1;
      }
    });

    let userCount: number[] = Array(12).fill(0);
    users.forEach((user) => {
      let created = user.createdAt;
      let monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 12) {
        userCount[12 - monthDiff - 1] += 1;
      }
    });
    let revenueCount: number[] = Array(12).fill(0);
    let discount: number[] = Array(12).fill(0);
    orders.forEach((order) => {
      let created = order.createdAt;
      let monthDiff = (today.getMonth() - created.getMonth() + 12) % 12;
      if (monthDiff < 12) {
        revenueCount[12 - monthDiff - 1] += order.total;
        discount[12 - monthDiff - 1] += order.discount;
      }
    });

    charts = {
      productCount,
      userCount,
      revenueCount,
      discount,
    };
    myCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
