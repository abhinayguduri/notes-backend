// api/tests/unit/note.controller.test.js
const { deleteNote } = require('../../controllers/note.controller');
const Note = require('../../models/note.schema');
const logger = require('../../utils/logger');

jest.mock('../../models/note.schema');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));

describe('Unit Test - deleteNote', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: { id: 'note123' },
      user: { id: 'userXYZ' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  it('should return 404 if the note is not found or user does not own it', async () => {
    // Mock findOne to return null => not found
    Note.findOne.mockResolvedValue(null);

    await deleteNote(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({ _id: 'note123', owner: 'userXYZ' });
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Note not found or access denied.',
    });
  });

  it('should delete the note and return 200 if found and owned by user', async () => {
    // Mock findOne to return a note doc
    Note.findOne.mockResolvedValue({ _id: 'note123', owner: 'userXYZ' });
    // Mock deleteOne
    Note.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });

    await deleteNote(mockReq, mockRes);

    expect(Note.findOne).toHaveBeenCalledWith({ _id: 'note123', owner: 'userXYZ' });
    expect(Note.deleteOne).toHaveBeenCalledWith({ _id: 'note123' });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Note deleted successfully.',
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    // Simulate a DB error from findOne
    Note.findOne.mockImplementation(() => {
      throw new Error('DB error');
    });

    await deleteNote(mockReq, mockRes);

    expect(logger.error).toHaveBeenCalledWith('Error deleting note:', expect.any(Error));
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});
