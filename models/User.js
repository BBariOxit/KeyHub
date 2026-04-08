import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id:{ type: String, required:true },
  name: { type: String, required:true },
  email: { type: String, required:true, unique: true },
  imageUrl: { type: String, required:true },
  cartItems: { type:Object, default: {} },
  favorites: { type: [String], default: [] }
}, {minimize: false })

let User = mongoose.models.user

if (User && !User.schema.path('favorites')) {
  delete mongoose.models.user
  User = undefined
}

User = User || mongoose.model('user', userSchema)

export default User