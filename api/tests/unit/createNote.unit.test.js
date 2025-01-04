// api/tests/unit/note.controller.test.js

const { createNote } = require('../../controllers/note.controller');
const Note = require('../../models/note.schema');
const logger = require('../../utils/logger');
const { validate } = require('../../utils/validate');
const { validationResult } = require('express-validator');

jest.mock('../../models/note.schema');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));
jest.mock('../../utils/validate');
jest.mock('express-validator');

describe('Unit Test - createNote', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Suppress console.error if you wish
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockRequest = {
      body: {
        title: 'Sample Note',
        content: 'This is a sample content',
        description: 'Sample description',
      },
      user: {
        id: 'user123', // Typically set by auth middleware
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  it('should return 400 if validation errors exist', async () => {
    // Mock the validate calls so they don't throw
    validate.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true),
    }));

    // Mock the validationResult to simulate errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid title', param: 'title' }],
    });

    await createNote(mockRequest, mockResponse);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Invalid title', param: 'title' }],
    });
  });

  it('should return 400 if a note with the same title already exists', async () => {
    // Mock no validation errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => [],
    });

    // Simulate existing note
    Note.findOne.mockResolvedValueOnce({
      _id: 'existingNoteId',
      title: 'Sample Note',
      owner: 'user123',
    });

    await createNote(mockRequest, mockResponse);

    expect(Note.findOne).toHaveBeenCalledWith({
      title: 'Sample Note',
      owner: 'user123',
    });
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'A note with the title "Sample Note" already exists.',
    });
  });

  it('should create a note and return 201 if all is valid', async () => {
    // Mock no validation errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => [],
    });

    // No existing note
    Note.findOne.mockResolvedValueOnce(null);

    // Mock note creation
    Note.create.mockResolvedValueOnce({
      _id: 'note123',
      title: 'Sample Note',
      content: 'This is a sample content',
      description: 'Sample description',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    await createNote(mockRequest, mockResponse);

    expect(Note.findOne).toHaveBeenCalledWith({
      title: 'Sample Note',
      owner: 'user123',
    });
    expect(Note.create).toHaveBeenCalledWith({
      title: 'Sample Note',
      content: 'This is a sample content',
      description: 'Sample description',
      owner: 'user123',
      sharedWith: [],
    });

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Note created successfully.',
      note: {
        id: 'note123',
        title: 'Sample Note',
        description: 'Sample description',
        content: 'This is a sample content',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    // Mock no validation errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => [],
    });

    // Simulate a DB error
    Note.findOne.mockRejectedValueOnce(new Error('DB Error'));

    await createNote(mockRequest, mockResponse);

    expect(logger.error).toHaveBeenCalledWith(
      'Error creating note:',
      expect.any(Error)
    );
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
  });
});
