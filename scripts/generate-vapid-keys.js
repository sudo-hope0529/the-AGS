const crypto = require('crypto');

function generateVAPIDKeys() {
  const vapidKeys = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  const publicKey = Buffer.from(vapidKeys.publicKey, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const privateKey = Buffer.from(vapidKeys.privateKey, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey,
    privateKey
  };
}

const keys = generateVAPIDKeys();

console.log('VAPID Keys generated:');
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);

console.log('\nAdd these to your .env file:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`NEXT_PUBLIC_VAPID_PRIVATE_KEY=${keys.privateKey}`);
