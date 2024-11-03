const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:{type:String, required:true} , 
  email: {type: String,required: true, unique:true},
  password: {type: String,required: true,},
  profileImage: {
    type: String, 
    default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
  },
  canMessage: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Users this user is allowed to message (set by admin)
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model
module.exports = mongoose.model('User', userSchema);
