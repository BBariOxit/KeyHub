import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
  userId: { 
    type: String,
    ref: 'user', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  pinCode: { 
    type: String,
    required: true,
    trim: true 
  },
  area: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
}, { 
  timestamps: true
})

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema)

export default Address