const User = require('../models/user.schema');
const bcrypt = require('bcryptjs');
const { validate } = require('../utils/validate');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger'); // Custom logger
const jwt = require('jsonwebtoken');
exports.createUser = async (req, res, next) => {
  const { firstname, lastname, email, password } = req.body;

  try {
    // Run validations
    await validate('firstname', { required: true, minLength: 3, maxLength: 50 }).run(req);
    await validate('lastname', { required: true, minLength: 1, maxLength: 50 }).run(req);
    await validate('email', { required: true, isEmail: true }).run(req);
    await validate('password', {
      required: true,
      minLength: 6,
      specialChar: true,
      uppercase: true,
      lowercase: true,
      number: true,
      noName: true,
    }).run(req);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ errors: [{ msg: 'Email already in use.', param: 'email' }] });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    // Respond with success message
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
      },
    });
  } catch (error) {
    logger.error(error); // Use custom logger
    res.status(500).json({ error: 'Internal server error.' });
  }
};


exports.signinUser = async (req, res) => {
  try {
    // Run validations using the validate utility
    await validate('email', { required: true, isEmail: true }).run(req);
    await validate('password', { required: true }).run(req);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // Respond with token
    res.status(200).json({
      message: 'Sign in successful.',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

