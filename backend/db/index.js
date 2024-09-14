const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
mongoose.connect(process.env.MONGO_URI);
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],  // 'admin' can create/manage events; 'user' can RSVP
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date, 
    required: true
  },
  organiser: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the user who created the event
    ref: 'User',
    required: true,
  },
  attendees: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rsvpStatus: {
        type: String,
        enum: ['yes', 'no', 'maybe'],
        required: true,
      },
    },
  ],
});
// Hash password before saving to DB

const User = mongoose.model('Users', userSchema);
const Event = mongoose.model('Events', eventSchema);

module.exports = { User, Event };