const { ec } = require("elliptic");
const { ethers } = require("ethers");

// const mess2sign =
//   "DEM3: please sign this message to be able to access private groups";
//signing a message using the user's wallet to be able to use it the seed string in line 7

// const signature = window.web3.eth.personal.sign(mess2sign, accountAddress);

// Replace the seed value with your own
const seed = "signature";

// Generate a SHA256 hash of the seed value
const hash = ethers.utils.sha256(Buffer.from(seed));

// Create an elliptic curve object using the secp256k1 curve
const curve = new ec("secp256k1");

// Generate a key pair using the hashed seed value as the private key
const keyPair = curve.genKeyPair({ entropy: hash });

// Get the private and public keys as hexadecimal strings
const privateKey = keyPair.getPrivate("hex");
const publicKey = keyPair.getPublic("hex");

//private key has to be stored on the local machine (phone)
console.log("Private key:", privateKey);

//public key has to be sent to the user object using and API endpoint that ahmed will make
console.log("Public key:", publicKey);
