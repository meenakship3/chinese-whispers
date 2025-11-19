const authModel = require('../models/authModel');
const { exec } = require('child_process');
const { promisify } = require('util');

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
        const script = `
            set dialogText to "EnvVault wants to unlock using Touch ID"
            do shell script "echo 'Authenticated'" with administrator privileges with prompt dialogText
        `;

        await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
        isAuthenticated = true;
        return true;
    } catch {
        throw new Error('Touch ID failed or was cancelled');
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