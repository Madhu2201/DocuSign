import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'sender', 'signer'],
    default: 'sender',
    required: true
  },
 resetToken: {
  type: String,
},
resetTokenExpiry: {
  type: Date,
}
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;