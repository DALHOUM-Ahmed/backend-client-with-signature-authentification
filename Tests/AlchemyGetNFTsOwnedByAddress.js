const axios = require("axios");

// Wallet address
const address = "0x5cB308Df65a724d29e4F37e37542Aaf10559e088";

// Alchemy URL
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/nTn8N1nox10Mu8Rs4kIMJO_MCZCyDAgx`;
const url = `${baseURL}/getNFTs/?owner=${address}`;

const config = {
  method: "get",
  url: url,
};

// Make the request and print the formatted response:
axios(config)
  .then((response) => {
    // console.log(response["data"])
    response["data"].ownedNfts.map((e) => console.log(e.contract));
  })
  .catch((error) => console.log("error", error));
