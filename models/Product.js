import mongoose from "mongoose";
import "@/models/Category";

const specificationItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 300 }
  },
  { _id: false }
)

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'user' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  detailedDescription: { type: String, default: '' },
  specifications: {
    type: [specificationItemSchema],
    default: []
  },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  image: { type: [String], required: true },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'category' }],
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  timestamp: { type: Number, required: true, default: Date.now }
})

if (mongoose.models.product) {
  delete mongoose.models.product
}

const Product = mongoose.model('product', productSchema)

export default Product