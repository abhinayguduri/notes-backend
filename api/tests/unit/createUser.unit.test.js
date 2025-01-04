// api/tests/unit/createUser.unit.test.js
const bcrypt = require('bcryptjs');
const User = require('../../models/user.schema');
const { createUser } = require('../../controllers/auth.controller');

// Mock express-validator pieces
const { validationResult } = require('express-validator');

// Mock the custom validation utility
const { validate } = require('../../utils/validate');

// Mock everything
jest.mock('bcryptjs');
jest.mock('../../models/user.schema');
jest.mock('express-validator');
jest.mock('../../utils/validate', () => ({
  validate: jest.fn(() => ({
    run: jest.fn().mockResolvedValue(true),
  })),
}));

describe('Unit Test - createUser', () => {
  let mockRequest;
  let mockResponse;
  let next;

  beforeEach(() => {
    // Suppress console.error to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockRequest = {
      body: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'ValidPassword123!',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Clear existing mock calls/implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error.mockRestore();
  });

  it('should return 400 if validation errors exist', async () => {
    // Make sure the custom validate calls won't throw
    validate.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true),
    }));

    // Now mock validationResult to simulate errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => false, // signals validation errors
      array: () => [{ msg: 'Invalid email format.', param: 'email' }],
    });

    await createUser(mockRequest, mockResponse, next);

    // 1) validate(...) was called 4 times (firstname, lastname, email, password)
    expect(validate).toHaveBeenCalledTimes(4);

    // 2) validationResult called with our request
    expect(validationResult).toHaveBeenCalledWith(mockRequest);

    // 3) We expect 400 since validation errors were found
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Invalid email format.', param: 'email' }],
    });
  });

  it('should return 400 if email is already in use', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => [],
    });

    // Simulate that the user already exists
    User.findOne.mockResolvedValueOnce({
      _id: '1',
      email: 'john.doe@example.com',
    });

    await createUser(mockRequest, mockResponse, next);

    // User.findOne should be called with email
    expect(User.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });

    // Return 400 with specific error message
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Email already in use.', param: 'email' }],
    });
  });

  it('should return 201 and create a user if all validations pass', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Email does not exist
    User.findOne.mockResolvedValueOnce(null);

    // Bcrypt hashing mock
    bcrypt.hash.mockResolvedValueOnce('hashedPassword');

    // Creating new user
    User.create.mockResolvedValueOnce({
      _id: '1',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword',
    });

    await createUser(mockRequest, mockResponse, next);

    // Confirm findOne was called
    expect(User.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });

    // Confirm password hashing
    expect(bcrypt.hash).toHaveBeenCalledWith('ValidPassword123!', 10);

    // Confirm user creation
    expect(User.create).toHaveBeenCalledWith({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedPassword',
    });

    // Confirm 201 response
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User registered successfully.',
      user: {
        id: '1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
      },
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    // No validation errors
    validationResult.mockReturnValueOnce({ isEmpty: () => true, array: () => [] });

    // Throw DB error
    User.findOne.mockRejectedValueOnce(new Error('DB Error'));

    await createUser(mockRequest, mockResponse, next);

    // Confirm we at least tried to check for an existing user
    expect(User.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });

    // Confirm we got a 500 response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error.' });

    // Confirm console.error was called with the thrown error
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });
});
