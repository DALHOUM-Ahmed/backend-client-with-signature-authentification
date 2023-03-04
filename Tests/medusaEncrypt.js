const { encrypt } = require('medusa-crypto');

const plaintext = 'Hello, world!';
const password = 'mysecretpassword';

encrypt(plaintext, password)
  .then(ciphertext => console.log(ciphertext))
  .catch(error => console.error(error));
