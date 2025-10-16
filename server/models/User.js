const mongoose = require('mongoose');
require('./Pokemon'); // ensure Pokemon model is registered

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  pokemon: [{
    pokemonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pokemon',
      required: true
    },
    level: {
      type: Number,
      default: 1,
      required: true
    }
  }]
});

// Remove sensitive fields when converting to JSON
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
