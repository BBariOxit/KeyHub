import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

const Category = mongoose.models.category || mongoose.model("category", categorySchema);

export default Category;
