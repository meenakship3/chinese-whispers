const authModel = require('../models/authModel');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

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

function isTouchIDAvailable() {
    return process.platform === 'darwin';
}

async function authenticateWithTouchID() {
    if (!isTouchIDAvailable()) {
        throw new Error('Touch ID is not available on this platform');
    }

    try {
        const pythonScript = path.join(__dirname, 'touchid_auth.py');
        const { stdout } = await execAsync(`python3 "${pythonScript}"`);
        
        if (stdout.trim() === 'SUCCESS') {
            isAuthenticated = true;
            return true;
        } else {
            throw new Error('Authentication failed');
        }
    } catch {
        throw new Error('Touch ID authentication failed or was cancelled');
    }
}

module.exports = {
    checkIfSetup,
    setup,
    verify,
    isUserAuthenticated,
    lock,
    isTouchIDAvailable,
    authenticateWithTouchID
};