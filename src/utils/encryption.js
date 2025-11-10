const crypto = require('crypto');

const encrypt = (key, plaintext) => {
  const iv = crypto.randomBytes(12).toString('base64');
  const cipher = crypto.createCipheriv(
    "aes-256-gcm", 
    Buffer.from(key, 'base64'), 
    Buffer.from(iv, 'base64')
  );
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');
  
  return `${iv}:${ciphertext}:${tag}`

}

const decrypt = (key, combinedString) => {
    const [iv, ciphertext, tag] = combinedString.split(":");
   const decipher = crypto.createDecipheriv(
    "aes-256-gcm", 
    Buffer.from(key, 'base64'),
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

module.exports = {
    encrypt,
    decrypt
}

