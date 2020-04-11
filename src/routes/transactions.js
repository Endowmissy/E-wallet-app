import express from "express";
import { initializePayment, verifyPayment } from "../helpers/paystack";
import Transaction from "../models/transactions";
import User from "../models/user";
import crypto from "crypto";
import Wallet from "../models/wallet";
const router = express.Router();

// Funding of wallet
router.post("/payment/create", async (req, res, next) => {
  req.assert("amount", "Please enter the Amount you want to add into your wallet").notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    req.flash("success_msg", errors[0].msg);
    return res.redirect("back");
  }

  // payload to send to paystack to initialize a transaction
  const paystack_data = {
    amount: parseInt(req.body.amount) * 100,
    email: req.user.email,
    reference: crypto.randomBytes(4).toString("hex"),
  };

  let payment_gateway_response = await initializePayment(paystack_data);

  let transation_payload = {
    userId: req.user.id,
    amount: parseInt(req.body.amount),
    status: "pending",
    reference: paystack_data.reference,
    access_code: payment_gateway_response.data.access_code,
  };

  await Transaction.create(transation_payload);
  if (payment_gateway_response) res.redirect(301, payment_gateway_response.data.authorization_url);
});

router.get("/payment/verify", async (req, res, next) => {
  const { trxref } = req.query;

  if (!trxref) {
    req.flash("success_msg", "Transaction reference not found");
    return res.redirect("/user/dashboard");
  }

  const payment_status = await verifyPayment(trxref);

  let { status, ip_address, reference, currency, channel } = payment_status.data.data;

  await Transaction.updateOne(
    { userId: req.user.id, reference },
    { $set: { status }, ip_address, reference, currency, channel },
  );

  let transaction_id = await Transaction.findOne({ userId: req.user.id, reference });

  // fund the user wallet only if the transaction status is success
  if (status == "success") {
    // if the payment was successfull, increase the user's balance with the added amount. the default
    // amount in a user's account is 0
    await User.updateOne({ _id: req.user.id }, { $inc: { balance: transaction_id.amount } });

    req.flash(
      "succes_msg",
      "Transaction Successfully. The amount of " +
        payment_details.amount +
        " has been funded in your wallet",
    );
    return res.redirect("back");
  } else {
    req.flash("success_msg", "Payment Unsuccessfull");
    return res.redirect("back");
  }
});

/**
 * sending of virtual money. You can send money to a user via their virtual_account_id
 * the virtual_account_id looks like an account number, you can ask that from the user
 * you can also send money to a user via their email.
 * @param {String} recepient Recepient can be email or a virtual account ID
 * @param {Number} amount
 */

router.post("/transfer/create", async (req, res, next) => {
  // check if the recepient and amount field is not empty
  req.assert("recepient", "The Recepient field cannot be left empty").notEmpty();
  req.assert("amount", "Pls enter the amount you will like to Gift out").notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    req.flash("success_msg", errors[0].msg);
    return res.redirect("back");
  }

  // search the database for the user either with the email or the virtal account id, skip the logged in user
  const { amount, recepient, transaction_remark } = req.body;
  let receiver = await User.find({
    _id: { $ne: req.user.id },
    $or: [{ email: recepient }, { virtual_account_id: recepient }],
  });

  // if not user found, send a message back
  if (!receiver) {
    req.flash("success_msg", "The Receiver's account was not found, You can try again.");
    return res.redirect("back");
  }

  // if user was found, check if the sender has up to the amount they want to transfer in their acc
  const user_has_enough_balance = req.user.balance >= parseInt(amount);

  // if user has enough balance, make the transer, Update the sender's balance else, send a message back to the user
  if (user_has_enough_balance) {
    await Wallet.create({
      senderId: req.user.id,
      receiverId: receiver._id,
      amount: parseInt(amount),
      transaction_remark,
    });

    let sender_current_balance = await User.findById(req.user.id);
    await User.updateOne(
      { _id: req.user.id },
      { $set: { balance: sender_current_balance - parseInt(amount) } },
    );

    req.flash("success_msg", "Transfer Successfull.");
    return res.redirect("back");
  } else {
    req.flash(
      "success_msg",
      "Insufficient funds. You dont have enough money to make this transfer.",
    );
    return res.redirect("back");
  }
});

export default router;
