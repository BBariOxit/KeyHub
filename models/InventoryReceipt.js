import mongoose from "mongoose";
import "@/models/Product";
import "@/models/Supplier";

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
  idempotencyKey: {
    type: String,
    trim: true,
    maxlength: 128,
    default: null
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
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

inventoryReceiptSchema.index(
  { enteredBy: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" }
    }
  }
);

const InventoryReceipt = mongoose.models.inventoryReceipt || mongoose.model("inventoryReceipt", inventoryReceiptSchema);

export default InventoryReceipt;
