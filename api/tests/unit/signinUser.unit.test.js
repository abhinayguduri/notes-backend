// api/tests/unit/auth.test.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.schema');
const { signinUser } = require('../../controllers/auth.controller');

// Mocking the necessary modules
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../models/user.schema'); // Mocking the User model

describe('Unit Test - signinUser', () => {
  let mockRequest;
  let mockResponse;
  let next;

  beforeEach(() => {
    // Suppress all console.error logs during test execution
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockRequest = {
      body: { email: 'john.doe@example.com', password: 'validPassword123' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore(); // Restore console.error after tests
  });

  it('should return 401 if email is incorrect', async () => {
    User.findOne.mockResolvedValue(null); // Mocking that no user was found

    await signinUser(mockRequest, mockResponse, next);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid email or password.' });
  });

  it('should return 401 if password is incorrect', async () => {
    const user = {
      _id: '1',
      email: 'john.doe@example.com',
      password: 'hashedPassword', // mock password hash
    };
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(false); // Simulate wrong password

    await signinUser(mockRequest, mockResponse, next);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid email or password.' });
  });

  it('should return 200 and a token if signin is successful', async () => {
    const user = {
      _id: '1',
      email: 'john.doe@example.com',
      password: 'hashedPassword', // mock password hash
    };
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true); // Simulate correct password
    jwt.sign.mockReturnValue('mocked_jwt_token'); // Mock JWT token generation

    await signinUser(mockRequest, mockResponse, next);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Sign in successful.',
      token: 'mocked_jwt_token',
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const error = new Error('DB error');
    User.findOne.mockRejectedValue(error); // Simulate DB error

    await signinUser(mockRequest, mockResponse, next);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});
