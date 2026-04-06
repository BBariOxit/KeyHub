import mongoose from "mongoose";

const inventoryReceiptItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  importPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const inventoryReceiptSchema = new mongoose.Schema({
  enteredBy: {
    type: String,
    ref: "user",
    required: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  items: {
    type: [inventoryReceiptItemSchema],
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: "Inventory receipt must contain at least one item"
    }
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: "",
    trim: true
  }
}, {
  timestamps: true
});

const InventoryReceipt = mongoose.models.inventoryReceipt || mongoose.model("inventoryReceipt", inventoryReceiptSchema);

export default InventoryReceipt;
