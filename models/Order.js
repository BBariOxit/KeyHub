import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'user' },
  idempotencyKey: { type: String, trim: true, default: null, maxlength: 128 },
  items: [{
    product: { type: String, required: true, ref: 'product' },
    quantity: { type: Number, required: true}
  }],
  amount: { type: Number, required: true},
  address: { type: String, required: true, ref: 'address'},
  status: { type: String, required: true, default: 'Order Placed'},
  date: { type: Date, default: Date.now }
})

orderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: 'string' }
    }
  }
)

const Order = mongoose.models.order || mongoose.model('order', orderSchema)

export default Order