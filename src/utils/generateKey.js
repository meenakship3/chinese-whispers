const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('base64');
console.log('\n=================================');
console.log(`Your Encryption Key is ${key}`);
console.log(`\nAdd this to your .env file: ENCRYPTION_KEY=${key}`);
console.log('\nWARNING: Save this key securely. If lost, all encrypted tokens are unrecoverable!');
console.log('=================================\n');


