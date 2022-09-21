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

const changePassword = joi.object({
    currentPassword: joi.string().min(8).required(),
    newPassword: joi.string().min(8).required(),
})

module.exports = {
    registerValidation,
    loginValidation,
    changePassword
}