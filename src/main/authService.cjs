const authModel = require('../models/authModel');

let isAuthenticated = false;

function checkIfSetup() {
    return authModel.isPasswordSetup();
}

async function setup(password) {
    if (!password || password.length < 4) {
        throw new Error('Password must be atleast 4 characters');
    }
    await authModel.setupPassword(password);
    isAuthenticated = true;
    return true;
}

async function verify(password) {
    const isValid = await authModel.verifyPassword(password);
    if (isValid) {
        isAuthenticated = true;
    }
    return isValid;
}

function isUserAuthenticated() {
    return isAuthenticated;
}

function lock() {
    isAuthenticated = false;
}

module.exports = {
    checkIfSetup,
    setup,
    verify,
    isUserAuthenticated,
    lock
};