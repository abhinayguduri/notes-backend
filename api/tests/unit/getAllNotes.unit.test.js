// api/tests/unit/note.controller.test.js
const { getAllNotes } = require('../../controllers/note.controller');
const Note = require('../../models/note.schema');
const logger = require('../../utils/logger');

jest.mock('../../models/note.schema');   // Mock the Note model
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));

describe('Unit Test - getAllNotes', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock request/response objects
    mockReq = {
      user: { id: 'user123' },
      query: {},       // default empty
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  it('should fetch owned and shared notes and return 200 with combined notes', async () => {
    // Mock query params
    mockReq.query.page = '1';
    mockReq.query.limit = '2';

    // Example data returned by Note.find() for owned vs shared
    const ownedNotesMock = [
      { _id: 'owned1', title: 'Owned Note 1', owner: 'user123' },
      { _id: 'owned2', title: 'Owned Note 2', owner: 'user123' },
    ];
    const sharedNotesMock = [
      { _id: 'shared1', title: 'Shared Note 1', sharedWith: ['user123'] },
    ];

    
    const findMockOwned = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(ownedNotesMock),
    };
    const findMockShared = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(sharedNotesMock),
    };

   
    Note.find
      .mockReturnValueOnce(findMockOwned)
      .mockReturnValueOnce(findMockShared);

    // Mock countDocuments for owned vs shared
    Note.countDocuments
      .mockResolvedValueOnce(2)   // owned count
      .mockResolvedValueOnce(1);  // shared count

    // Call the controller
    await getAllNotes(mockReq, mockRes);

    // Verify that we called Note.find with the correct queries
    expect(Note.find).toHaveBeenNthCalledWith(
      1,
      { owner: 'user123' } // owned
    );
    expect(Note.find).toHaveBeenNthCalledWith(
      2,
      { sharedWith: 'user123' } // shared
    );

    // Verify final response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Notes retrieved successfully.',
      notes: [
        // The two owned notes, with shared = false
        { _id: 'owned1', title: 'Owned Note 1', owner: 'user123', shared: false },
        { _id: 'owned2', title: 'Owned Note 2', owner: 'user123', shared: false },
        // The one shared note, with shared = true
        { _id: 'shared1', title: 'Shared Note 1', sharedWith: ['user123'], shared: true },
      ],
      pagination: {
        totalNotes: 3,
        page: 1,
        limit: 2,
        totalPages: Math.ceil(3 / 2),
      },
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    Note.find.mockImplementation(() => {
      throw new Error('DB Error');
    });

    await getAllNotes(mockReq, mockRes);

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
