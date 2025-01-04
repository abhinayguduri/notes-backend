const Note = require('../models/note.schema');
const logger = require('../utils/logger');


exports.searchUserNotes = async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  try {
    const userId = req.user.id;

    // Validate that search term is provided
    if (!q) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const skip = (page - 1) * limit;

    // Query to fetch notes owned by or shared with the user
    const query = {
      $text: { $search: q }, // Text search for provided query
      $or: [{ owner: userId }, { sharedWith: userId }], // Only owned or shared notes
    };

    // Fetch matching notes with pagination
    const notes = await Note.find(query)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-__v') // Exclude unnecessary fields
      .populate('owner', 'firstname lastname email') // Populate owner
      .populate('sharedWith', 'firstname lastname email') // Populate sharedWith
      .lean();

    // Add a `shared` field to each note
    notes.forEach(note => {
      note.shared = note.sharedWith.some(user => user._id.toString() === userId.toString());
    });

    // Count total matching notes for pagination metadata
    const totalNotes = await Note.countDocuments(query);

    // If no notes match the query
    if (notes.length === 0) {
      return res.status(404).json({ message: 'No matching notes found.' });
    }

    res.status(200).json({
      message: 'Search results retrieved successfully.',
      notes,
      pagination: {
        totalNotes,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalNotes / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching user notes:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

