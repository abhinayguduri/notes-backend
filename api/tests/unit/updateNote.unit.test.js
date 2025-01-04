// api/tests/unit/note.controller.test.js
const { updateNote } = require('../../controllers/note.controller');
const Note = require('../../models/note.schema');
const { validate } = require('../../utils/validate');
const { validationResult } = require('express-validator');

jest.mock('../../models/note.schema');
jest.mock('../../utils/validate');
jest.mock('express-validator');

describe('Unit Test - updateNote', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {
        id: 'note123',
        title: 'New Title',
        content: 'New Content',
        description: 'New Description',
      },
      user: { id: 'userXYZ' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  it('should return 400 if validation errors exist', async () => {
    // Mock the validation calls so they don't throw
    validate.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true),
    }));

    // Simulate that validationResult has errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid title', param: 'title' }],
    });

    await updateNote(mockReq, mockRes);

    expect(validationResult).toHaveBeenCalledWith(mockReq);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Invalid title', param: 'title' }],
    });
  });

  it('should return 404 if note not found or user not owner', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Suppose findOne returns null => note not found/owned
    Note.findOne.mockResolvedValue(null);

    await updateNote(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({ _id: 'note123', owner: 'userXYZ' });
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Note not found or access denied.',
    });
  });

  it('should return 400 if duplicate title is found', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // The note being updated is found
    const noteDoc = {
      _id: 'note123',
      title: 'Old Title',
      content: 'Old Content',
      description: 'Old Description',
      save: jest.fn(),
    };
    Note.findOne
      .mockResolvedValueOnce(noteDoc)     // First findOne => the note we're updating
      .mockResolvedValueOnce({ _id: 'anotherNote', title: 'New Title' }); // second findOne => duplicate note

    await updateNote(mockReq, mockRes);

    // The code checks if `title` changed and if so, it calls findOne again to check duplicates
    expect(Note.findOne).toHaveBeenNthCalledWith(1, {
      _id: 'note123',
      owner: 'userXYZ',
    });
    expect(Note.findOne).toHaveBeenNthCalledWith(2, {
      title: 'New Title',
      owner: 'userXYZ',
    });

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'A note with the title "New Title" already exists.',
    });
  });

  it('should update the note and return 200 if all is valid', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Found the note => no duplicates
    const noteDoc = {
      _id: 'note123',
      title: 'Old Title',
      content: 'Old Content',
      description: 'Old Description',
      owner: 'userXYZ',
      save: jest.fn().mockResolvedValue({
        _id: 'note123',
        title: 'New Title',
        content: 'New Content',
        description: 'New Description',
      }),
    };
    Note.findOne
      .mockResolvedValueOnce(noteDoc)     // first findOne => note
      .mockResolvedValueOnce(null);       // second findOne => no duplicates

    await updateNote(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenNthCalledWith(1, {
      _id: 'note123',
      owner: 'userXYZ',
    });
    // Because the new title != old title => it checks duplicates
    expect(Note.findOne).toHaveBeenNthCalledWith(2, {
      title: 'New Title',
      owner: 'userXYZ',
    });

    // The doc is updated
    expect(noteDoc.title).toBe('New Title');
    expect(noteDoc.content).toBe('New Content');
    expect(noteDoc.description).toBe('New Description');

    // The doc is saved
    expect(noteDoc.save).toHaveBeenCalled();

    // Final response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'note updated successfully.',
      note: {
        _id: 'note123',
        title: 'New Title',
        content: 'New Content',
        description: 'New Description',
      },
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    // Suppose findOne throws
    Note.findOne.mockImplementation(() => {
      throw new Error('DB error');
    });

    await updateNote(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });
});
