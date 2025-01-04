// api/tests/unit/getNoteById.unit.test.js
const { getNoteById } = require('../../controllers/note.controller');
const Note = require('../../models/note.schema');
const logger = require('../../utils/logger');

jest.mock('../../models/note.schema');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));

describe('Unit Test - getNoteById', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: { noteId: 'note123' },
      user: { id: 'user123' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  function makeNoteDoc(noteData) {
    // Mongoose doc that includes a .toObject() method
    return {
      ...noteData,
      toObject: jest.fn().mockReturnValue(noteData),
      sharedWith: noteData.sharedWith || [],
    };
  }

  // Helper to build a "chain" mock for findOne
  function mockFindOneReturnOnce(docOrNull) {
   
    const chain = {
      populate: jest.fn().mockReturnThis(), // for .populate('owner'...)
      select: jest.fn().mockReturnThis(),   // for .select('-__v')
      
      then: undefined, // We'll define 'then' so that awaiting the chain returns docOrNull
    };

    chain.then = (resolve, reject) => Promise.resolve(docOrNull).then(resolve, reject);

    // Finally, return the chain from findOne
    Note.findOne.mockReturnValueOnce(chain);
  }

  it('should return 404 if note not found or access denied', async () => {
    mockFindOneReturnOnce(null); // simulate no doc found

    await getNoteById(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({
      _id: 'note123',
      $or: [{ owner: 'user123' }, { sharedWith: 'user123' }],
    });
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Note not found or access denied.',
    });
  });

  it('should return 200 and the note if found (owner case)', async () => {
    const doc = makeNoteDoc({
      _id: 'note123',
      owner: { _id: 'user123' },
      sharedWith: [],
      title: 'My Owned Note',
    });
    mockFindOneReturnOnce(doc);

    await getNoteById(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({
      _id: 'note123',
      $or: [{ owner: 'user123' }, { sharedWith: 'user123' }],
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);

    // shared should be false if user not in sharedWith
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Note retrieved successfully.',
      note: {
        _id: 'note123',
        owner: { _id: 'user123' },
        sharedWith: [],
        title: 'My Owned Note',
        shared: false,
      },
    });
  });

  it('should return 200 and set shared=true if user is in sharedWith', async () => {
    const doc = makeNoteDoc({
      _id: 'note123',
      owner: { _id: 'owner789' },
      sharedWith: [{ _id: 'user123' }],
      title: 'Shared Note',
    });
    mockFindOneReturnOnce(doc);

    await getNoteById(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Note retrieved successfully.',
      note: {
        _id: 'note123',
        owner: { _id: 'owner789' },
        sharedWith: [{ _id: 'user123' }],
        title: 'Shared Note',
        shared: true,
      },
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    Note.findOne.mockImplementation(() => {
      throw new Error('DB Error');
    });

    await getNoteById(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith(
      'Error fetching notes:',
      expect.any(Error)
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });
});
