import dotenv from "dotenv";
dotenv.config();

import { Medusa } from "@medusa-network/medusa-sdk";
import { ethers, BigNumber } from "ethers";

// Hyperspace Testnet Medusa Address = "0xd466a3c66ad402aa296ab7544bce90bbe298f6a0";
// Arbitrum Testnet Medusa Address = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118";

const medusaAddress = "0xf1d5A4481F44fe0818b6E7Ef4A60c0c9b29E3118";
// const provider = new ethers.providers.JsonRpcProvider(
//   'https://api.hyperspace.node.glif.io/rpc/v1'
// )

const provider = new ethers.providers.JsonRpcProvider(
  `https://arb-goerli.g.alchemy.com/v2/demo`
);

const signer = new ethers.Wallet(process.env.PRIVATE_KEY_2).connect(provider);

const medusa = await Medusa.init(medusaAddress, signer);

//Now we have the ciphertext from the event

const ciphertext = {
  random: {
    x: BigNumber.from(
      "0x21fb4c6b094c4a87f9794f83fe0254560ca3e96968eada2226114b673c6df15d"
    ),
    y: BigNumber.from(
      "0x25b2688d6a9ca41c250c4e5550c9a0eb64a5abce7a96d113a7fafd8fe620a39b"
    ),
  },
  cipher: BigNumber.from(
    "0xc18f3d415baee12654b26e592021dec5399d796eebebc5ff7a7abf1a37961e3d"
  ),
  random2: {
    x: BigNumber.from(
      "0x21fb4c6b094c4a87f9794f83fe0254560ca3e96968eada2226114b673c6df15d"
    ),
    y: BigNumber.from(
      "0x25b2688d6a9ca41c250c4e5550c9a0eb64a5abce7a96d113a7fafd8fe620a39b"
    ),
  },
  dleq: {
    f: BigNumber.from("0x00"),
    e: BigNumber.from("0x00"),
  },
};

const blob = new Uint8Array([
  143, 199, 40, 53, 89, 140, 49, 90, 216, 193, 58, 240, 88, 214, 35, 112, 29,
  29, 102, 56, 109, 113, 253, 104, 210, 253, 218, 196, 226, 131, 38, 105, 135,
  91, 3, 172, 149, 239, 171, 1, 142, 2, 84, 74, 82, 124, 171, 67, 240, 228, 191,
  237, 242, 1, 195, 50, 176, 219, 27, 176, 101, 17, 27, 208, 11,
]);

const decryptedBytes = await medusa.decrypt(ciphertext, blob);
const plaintext = new TextDecoder().decode(decryptedBytes);

console.log(`Show me the text: ${plaintext}`);
