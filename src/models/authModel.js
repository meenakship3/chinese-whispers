const db = require('./db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function isPasswordSetup() {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM auth_config WHERE id = 1', [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

async function setupPassword(password) {
    const setupComplete = await isPasswordSetup();
    if (setupComplete) {
        throw new Error('Password already set up');
    }

    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    const hash = bcrypt.hashSync(password, salt);

    return new Promise((resolve, reject) => {
        db.run('INSERT INTO auth_config (id, password_hash, salt) VALUES (1, ?, ?)',
            [hash, salt],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

function verifyPassword(password) {
    return new Promise((resolve, reject) => {
        db.get('SELECT password_hash FROM auth_config WHERE id = 1', [], (err, row) => {
            if (err) {
                reject(err);
            } else if (!row) {
                reject(new Error('Password not set up'));
            } else {
                const isValid = bcrypt.compareSync(password, row.password_hash);
                resolve(isValid);
            }
        });
    });
}

module.exports = {
    isPasswordSetup,
    setupPassword,
    verifyPassword
};
