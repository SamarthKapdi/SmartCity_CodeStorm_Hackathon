const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      const messages = error.details.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Input is unsafe.',
        errors: messages
      });
    }
    next();
  };
};

module.exports = validate;
