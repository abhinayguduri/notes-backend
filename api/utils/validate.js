const { body } = require('express-validator');

const validate = (field, rules = {}) => {
  let validationChain = body(field);

  if (rules.required) validationChain = validationChain.notEmpty().withMessage(`${field} cannot be empty.`);
  if (rules.minLength) validationChain = validationChain.isLength({ min: rules.minLength }).withMessage(`${field} must be at least ${rules.minLength} characters long.`);
  if (rules.maxLength) validationChain = validationChain.isLength({ max: rules.maxLength }).withMessage(`${field} must be at most ${rules.maxLength} characters long.`);

  if (rules.isEmail) {
    validationChain = validationChain.isEmail().withMessage(`Invalid email format for ${field}`);
    validationChain = validationChain.normalizeEmail(); // Automatically normalize email if isEmail is true
  }

  if (rules.uppercase) validationChain = validationChain.matches(/^(?=.*[A-Z])/).withMessage(`${field} must contain at least one uppercase letter.`);
  if (rules.lowercase) validationChain = validationChain.matches(/^(?=.*[a-z])/).withMessage(`${field} must contain at least one lowercase letter.`);
  if (rules.number) validationChain = validationChain.matches(/^(?=.*\d)/).withMessage(`${field} must contain at least one number.`);
  
  if (rules.specialChar) validationChain = validationChain.matches(/^(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?])/).withMessage(`${field} must contain at least one special character.`);
  if (rules.isNumber) validationChain = validationChain.isFloat().withMessage(`${field} must be a valid number.`);
  if (rules.noName) validationChain = validationChain.custom((value, { req }) => {
    const firstName =req.user  ? req.user.first_name.toLowerCase() : req.body.firstname.toLowerCase() ;
    const lastName = req.user ? req.user.last_name.toLowerCase(): req.body.lastname.toLowerCase();
    if (value.toLowerCase().includes(firstName) || value.toLowerCase().includes(lastName)) {
      throw new Error(`${field} cannot contain your first or last name.`);
    }
    return true;
  });

  if (rules.trim) validationChain = validationChain.trim();
  if (rules.isArray) {
    validationChain = validationChain.isArray({ min: 0 }).withMessage(`${field} must be an array.`);

    if (rules.uniqueArray) {
      validationChain = validationChain.custom((value) => {
        if (Array.isArray(value) && new Set(value).size !== value.length) {
          throw new Error(`${field} must contain unique values.`);
        }
        return true;
      });
    }
  }

  return validationChain;
};

module.exports = { validate };