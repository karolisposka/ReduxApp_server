const joi = require('joi');

const registerValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    confirmPassword: joi.ref('password'),
});

const loginValidation = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
})

module.exports = {
    registerValidation,
    loginValidation
}