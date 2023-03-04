const { randomBytes } = require("crypto");
const keccak256 = require("keccak256");
require("dotenv").config();
const ethers = require("ethers");
const userAbi = require("./ABIs/user.json");

const provider = new ethers.providers.JsonRpcProvider(
  "https://testnet.aurora.dev"
);
const userContract = new ethers.Contract(
  "0xcfd48641c00Afd58fc068644Cfab09a4B3E65c23",
  userAbi,
  provider
);

var serverWallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);

// console.log("Address: " + serverWallet.address);

async function mainTest() {
  console.log("administration", await userContract.administration());
  await userContract
    .connect(serverWallet)
    .signin(
      "0xD1ca95Aa966baB48f9646F6a7183c4D6321aF6d1",
      "0xc38506f24476cca06c21d52d93d11df146f7391c268a98b486064b402a8be95c"
    );
}

function getRandom32Bytes() {
  for (let i = 0; i < 20; i++) {
    const buf = randomBytes(32);
    const bufHexString = "0x" + buf.toString("hex");
    console.log("Random Buffer: ", bufHexString);
  }
}

async function random32Bytes() {
  await userContract
    .connect(serverWallet)
    .signin("0xD1ca95Aa966baB48f9646F6a7183c4D6321aF6d1", getRandom32Bytes());
}

async function verifySigninAfterExpirationCheck(token) {
  const sessionHash =
    "0x" + keccak256(token.generatedBytes, token.signinTime).toString("hex");

  const signedAddress = await userContract.getSignedUser(sessionHash);
  console.log(
    "signed user",
    signedAddress.toLowerCase() == token.userAddress.toLowerCase()
  );
}

async function signup() {
  const newSession = "0x" + keccak256(123).toString("hex");
  console.log("newSession", newSession);
  await userContract
    .connect(serverWallet)
    .signupOwner(
      newSession,
      "0x96ef6E86a364F60cD233905D328eBB831FA94BEf",
      [
        "ahmed",
        "middlename",
        "dalhoum",
        "ahmed dalhoum",
        "white",
        "discord_link",
        "instagram_link",
        "twitter_link",
        "tiktok_link",
        "picture_upload",
        "email",
        "bio",
        "2626698585",
      ],
      11111111,
      0,
      ["blockchain", "data"],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13],
      ["0x93D5Dfc2d59F2a63244c252DBCC12F8126EC83A6", 2]
    );
}

// verifySigninAfterExpirationCheck({
//   generatedBytes:
//     "0x1d6d427e68b37e623ccfcab21e6b9e8493f736dc99cc7853f0452273aed312b6",
//   signinTime: 1671699088,
//   userAddress: "0xf9013432B10E1F446bb19D5b7C15baB43E9C3867",
// });

signup();
