const Note = require('../models/note.schema');
const { validate } = require('../utils/validate');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const User = require("../models/user.schema")

exports.createNote = async (req, res) => {
    const { title, content, description } = req.body;
  try {
    
    // Run validations
    await validate('title', { required: true, minLength: 3, maxLength: 50 }).run(req);
    await validate('content', { required: true, minLength: 5 }).run(req);
    await validate('description', { required: true, minLength: 5, maxLength:255 }).run(req);
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const existingNote = await Note.findOne({ title, owner: req.user.id });
    if (existingNote) {
      return res.status(400).json({
        error: `A note with the title "${title}" already exists.`,
      });
    }
    // Create the note
    const note = await Note.create({
      title,
      content,
      description,
      owner: req.user.id,
      sharedWith:[]
    });

    res.status(201).json({
      message: 'Note created successfully.',
      note: {
        id: note._id,
        title: note.title,
        description:note.description,
        content: note.content,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};




exports.getAllNotes = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;
  
      const ownedNotesQuery = Note.find({ owner: userId })
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .populate('owner', 'firstname lastname email')
        .populate('sharedWith', 'firstname lastname email') // Populate sharedWith
        .lean();
  
      const sharedNotesQuery = Note.find({ sharedWith: userId })
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .populate('owner', 'firstname lastname email')
        .populate('sharedWith', 'firstname lastname email') // Populate sharedWith
        .lean();
  
      const [ownedNotes, sharedNotes] = await Promise.all([
        ownedNotesQuery,
        sharedNotesQuery,
      ]);
  
      // Set the `shared` field for owned notes to `false`
      ownedNotes.forEach((note) => {
        note.shared = false;
      });
  
      // Set the `shared` field for shared notes to `true`
      sharedNotes.forEach((note) => {
        note.shared = true;
      });
  
      const [ownedCount, sharedCount] = await Promise.all([
        Note.countDocuments({ owner: userId }),
        Note.countDocuments({ sharedWith: userId }),
      ]);
  
      const totalNotes = ownedCount + sharedCount;
  
      res.status(200).json({
        message: 'Notes retrieved successfully.',
        notes: [...ownedNotes, ...sharedNotes],
        pagination: {
          totalNotes,
          page,
          limit,
          totalPages: Math.ceil(totalNotes / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
  


  exports.getNoteById = async (req, res, next) => {
    try {
      const { noteId } = req.params;
      const userId = req.user.id;
  
      // Find the note by ID that is either owned by the user or shared with the user
      const note = await Note.findOne({
        _id: noteId,
        $or: [{ owner: userId }, { sharedWith: userId }],
      })
        .populate('owner', 'firstname lastname email') // Populate owner details
        .populate('sharedWith', 'firstname lastname email') // Populate sharedWith details
        .select('-__v'); // Exclude unnecessary fields
  
      if (!note) {
        return res.status(404).json({ error: 'Note not found or access denied.' });
      }
  
      // Add a `shared` attribute if the note is shared
      const isShared = note.sharedWith.some((sharedUser) => sharedUser._id.toString() === userId.toString());
      const noteResponse = note.toObject();
      noteResponse.shared = isShared;
  
      res.status(200).json({
        message: 'Note retrieved successfully.',
        note: noteResponse,
      });
    } catch (error) {
      logger.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };



  exports.updateNote = async (req, res, next) => {
    try {
      const { id, title, content, description } = req.body;
      const userId = req.user.id;
      // Validate fields using the provided validate utility
      await Promise.all([
        title !== undefined &&
          validate('title', {
            required:true,
            minLength: 3,
            maxLength: 50,
            trim: true,
          }).run(req),
        content !== undefined &&
          validate('content', {
            required:true,
            minLength: 5,
            trim: true,
          }).run(req),
        description !== undefined &&
          validate('description', {
            required:true,
            maxLength: 255,
            trim: true,
          }).run(req),
      ]);
  
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const note = await Note.findOne({ _id: id, owner: userId });
      if (!note) {
        return res.status(404).json({ error: 'Note not found or access denied.' });
      }
      // Check for duplicate title
      if (title && title !== note.title) {
          const duplicateNote = await Note.findOne({ title, owner: userId });
          if (duplicateNote) {
            return res.status(400).json({ error: `A note with the title "${title}" already exists.` });
          }
        }
  
      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      if (description !== undefined) note.description = description;
  
      const updatedNote = await note.save();
  
      res.status(200).json({ message: 'note updated successfully.', note: updatedNote });
  
     
    } catch (error) {
      logger.error('Error updating note:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
  

exports.deleteNote = async (req, res) => {
    const { id } = req.body;
  
    try {
      const userId = req.user.id;
  
      // Find the note and ensure it is owned by the user
      const note = await Note.findOne({ _id: id, owner: userId });
      if (!note) {
        return res.status(404).json({ error: 'Note not found or access denied.' });
      }
  
      // Delete the note
      await Note.deleteOne({ _id: id });
  
      res.status(200).json({
        message: 'Note deleted successfully.',
      });
    } catch (error) {
      logger.error('Error deleting note:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };



exports.shareNote = async (req, res) => {
    const id = req.params.noteId
  const { sharedWith } = req.body;

  try {
    const userId = req.user.id;

    await validate('sharedWith', { required: true, isArray:true, uniqueArray:true }).run(req);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Ensure the note exists and is owned by the current user
    const note = await Note.findOne({ _id: id, owner: userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }


    const validUserIds = [];
    for (const userIdToShare of sharedWith) {
      const userExists = await User.exists({ _id: userIdToShare });
      if (userExists) {
        validUserIds.push(userIdToShare);
      }
    }

    if (validUserIds.length === 0) {
      return res.status(400).json({ error: 'None of the provided user IDs are valid.' });
    }

    // Add valid user IDs to the sharedWith field
    const updatedSharedWith = Array.from(
        new Set([...note.sharedWith.map(id => id.toString()), ...validUserIds])
      );
    note.sharedWith = updatedSharedWith;
    await note.save();

    res.status(200).json({
      message: 'Note shared successfully.',
      sharedWith: note.sharedWith,
    });
  } catch (error) {
    logger.error('Error sharing note:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};









