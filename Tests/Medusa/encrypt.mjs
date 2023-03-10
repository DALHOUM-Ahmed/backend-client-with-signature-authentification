import dotenv from "dotenv";
dotenv.config();

import { Medusa } from "@medusa-network/medusa-sdk";
import { ethers } from "ethers";
import { abi, applicationAddress } from "./constants.mjs";

// Hyperspace Testnet Medusa Address = "0xd466a3c66ad402aa296ab7544bce90bbe298f6a0";
// Arbitrum Testnet Medusa Address = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118";

const medusaAddress = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118";
// const provider = new ethers.providers.JsonRpcProvider(
//   'https://api.hyperspace.node.glif.io/rpc/v1'
// )

const provider = new ethers.providers.JsonRpcProvider(
  `https://arb-goerli.g.alchemy.com/v2/demo`
);

const signer = new ethers.Wallet(process.env.PRIVATE_KEY_1).connect(provider);

const medusa = await Medusa.init(medusaAddress, signer);

const medusaPublicKey = await medusa.fetchPublicKey();
console.log("medusaPublicKey", medusaPublicKey);

//Lets encrypt our data!
const plaintext = "Deme test data to encrypt";
const buff = new TextEncoder().encode(plaintext);

//Encrypt data with Medusa
const { encryptedData, encryptedKey } = await medusa.encrypt(
  buff,
  applicationAddress
);
console.log(`encryptedData: ${encryptedData}`);

//Now we interact with the app contract OnliFiles.sol
//We create a listing and set the "policy"
//Here we pass the encryptedkey and submit it to medusa

const onlyFiles = new ethers.Contract(applicationAddress, abi, signer);

const price = 0; //ethers.utils.parseEther("0.01");

const result = await onlyFiles.functions
  .createListing(
    encryptedKey,
    "Data Name",
    "Description of the data",
    price,
    "https://ipfs.io/ipfs/QmaiyzWd7uknfVUWJ4sZTaM9VSLoPLiFwULWghGAUNDdeu"
  )
  .then((transaction) => {
    console.log(transaction);

    // Listen to the 'NewListing' event
    onlyFiles.on(
      "NewListing",
      (seller, cipherId, name, description, price, uri, event) => {
        console.log(
          `New Listing created: 
    seller = ${seller}
    cipherId = ${cipherId} 
    name = ${name} 
    description = ${description} 
    price = ${price} 
    uri = ${uri} 
    blockNumber = ${event.blockNumber}`
        );
      }
    );
  })
  .catch((error) => {
    console.error(error);
  });
