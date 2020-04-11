import mongoose from "mongoose";
const Schema = mongoose.Schema;
const transactionSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    amount: Number,
    transaction_remark: String,
  },
  { timestamps: true },
);

export default mongoose.model("Wallet", transactionSchema);
