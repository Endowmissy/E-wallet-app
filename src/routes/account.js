import express from "express";
import Wallet from "../models/wallet";
import mongoose from "mongoose";
import Transactions from "../models/transactions";
const router = express.Router();

let wallet_query = async (query) => {
  return await Wallet.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: null,
        amount: {
          $sum: "$amount",
        },
      },
    },
  ]);
};

router.get("/user/dashboard", async (req, res, next) => {
  let total_funds_sent = wallet_query({ senderId: mongoose.Types.ObjectId(req.user.id) });
  let total_funds_received = wallet_query({
    receiverId: mongoose.Types.ObjectId(req.user.id),
  });
  // Only last 10 transactions will be shown in user dashboard homepage
  let transaction_details = await Transactions.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10);

  res.render("./account/dashboard", {
    title: "Dashboard",
    total_funds_sent,
    total_funds_received,
    transaction_details,
  });
});

router.get("/user/dashboard/transaction-history", async (req, res, next) => {
  let transaction_details = await Transactions.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.render("./account/transactions", {
    title: "Dashboard | Transactions",
    transaction_details,
  });
});

//router.get("/user/dashboard/wallet-history")

export default router;
