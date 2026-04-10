const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const fieldErrors = error.details.reduce((acc, err) => {
        const key = err.path?.join('.') || 'general';
        if (!acc[key]) acc[key] = err.message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: Object.values(fieldErrors),
        fieldErrors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
