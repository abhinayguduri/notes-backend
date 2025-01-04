// api/tests/unit/note.controller.test.js
const { shareNote } = require('../../controllers/note.controller');
const { validationResult } = require('express-validator');
const { validate } = require('../../utils/validate');
const logger = require('../../utils/logger');
const Note = require('../../models/note.schema');
const User = require('../../models/user.schema');

jest.mock('../../utils/validate');
jest.mock('express-validator');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));
jest.mock('../../models/note.schema');
jest.mock('../../models/user.schema');

describe('Unit Test - shareNote', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: { noteId: 'note123' },
      body: {
        sharedWith: ['userA', 'userB'],
      },
      user: { id: 'ownerXYZ' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  it('should return 400 if validation fails', async () => {
    // Mock the custom validate so it doesn't throw
    validate.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true),
    }));
    // Mock validationResult to produce an error
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid sharedWith', param: 'sharedWith' }],
    });

    await shareNote(mockReq, mockRes);

    expect(validationResult).toHaveBeenCalledWith(mockReq);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Invalid sharedWith', param: 'sharedWith' }],
    });
  });

  it('should return 404 if note not found or access denied', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Mock findOne => null => note not found/owned
    Note.findOne.mockResolvedValue(null);

    await shareNote(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({ _id: 'note123', owner: 'ownerXYZ' });
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Note not found or access denied.',
    });
  });

  it('should return 400 if none of the provided user IDs are valid', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // The note is found/owned
    const noteDoc = {
      _id: 'note123',
      owner: 'ownerXYZ',
      sharedWith: [],
      save: jest.fn().mockResolvedValue(true),
    };
    Note.findOne.mockResolvedValue(noteDoc);

    // Mock User.exists => all false => none found
    User.exists.mockResolvedValue(false);

    await shareNote(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'None of the provided user IDs are valid.',
    });
  });

  it('should share the note successfully and return 200', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Found the note
    const noteDoc = {
      _id: 'note123',
      owner: 'ownerXYZ',
      sharedWith: ['existingUser'],
      save: jest.fn().mockResolvedValue(true),
    };
    Note.findOne.mockResolvedValue(noteDoc);

    // Suppose 'userA' and 'userB' both exist in DB => true
    User.exists.mockResolvedValue(true);

    await shareNote(mockReq, mockRes);

  
    expect(noteDoc.sharedWith).toEqual(expect.arrayContaining([
      'existingUser',
      'userA',
      'userB'
    ]));

    expect(noteDoc.save).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Note shared successfully.',
      sharedWith: noteDoc.sharedWith,
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    Note.findOne.mockImplementation(() => {
      throw new Error('DB error');
    });

    await shareNote(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith(
      'Error sharing note:',
      expect.any(Error)
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });
});
