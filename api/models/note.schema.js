const mongoose = require('mongoose');
const User = require("./user.schema")
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User, // Reference to the User model
      required: true,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User, // References to users with whom the note is shared
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create a text index for optimized search
noteSchema.index({ title: 'text', content: 'text' , description:'text'});

const Note = mongoose.model(process.env.DB_PREFIX + 'notes', noteSchema);

module.exports = Note;