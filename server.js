require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const keccak256 = require("keccak256");
const cors = require("cors");
const bodyParser = require("body-parser");
const ethUtil = require("ethereumjs-util");
const userAbi = require("./ABIs/user.json");
const { randomBytes } = require("crypto");

const sessionExpirationDelayInSeconds = 1000;

const provider = new ethers.providers.JsonRpcProvider(
  "https://testnet.aurora.dev"
);
const userContract = new ethers.Contract(
  "0xcfd48641c00Afd58fc068644Cfab09a4B3E65c23",
  userAbi,
  provider
);

var serverWallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);
console.log("Address: " + serverWallet.address);

// 1970 utc
function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getRandom32Bytes() {
  const buf = randomBytes(32);
  const bufHexString = "0x" + buf.toString("hex");
  return bufHexString;
}

const app = express();
// app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);
// app.use(express.json());
const port = 5000;

//verify sessionExpirationDelayInSeconds before to be able to return session expiration reason
async function verifySigninAfterExpirationCheck(token) {
  const sessionHash =
    "0x" + keccak256(token.generatedBytes, token.signinTime).toString("hex");

  const signedAddress = await userContract.getSignedUser(sessionHash);
  console.log(
    "signed user",
    signedAddress.toLowerCase() == token.userAddress.toLowerCase()
  );
  return signedAddress.toLowerCase() == token.userAddress.toLowerCase();
}

app.post("/check-signin", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    var token = { success: false };
    if (
      getTimestampInSeconds() - req.body.signinTime >=
      sessionExpirationDelayInSeconds
    ) {
      token.reason = "session expired";
      res.json(token);
    } else {
      const isCorrect = await verifySigninAfterExpirationCheck(req.body);
      console.log("isCorrect", isCorrect);
      ////Operation code
      token.success = isCorrect;
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/update-username", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    var token = { success: false, signinTime: req.body.signinTime };
    if (
      getTimestampInSeconds() - req.body.signinTime >=
      sessionExpirationDelayInSeconds
    ) {
      token.reason = "session expired";
      res.json(token);
    } else {
      const isCorrect = await verifySigninAfterExpirationCheck(req.body);
      console.log("isCorrect", isCorrect);
      if (isCorrect) {
        ////Operation code
        const sessionHash =
          "0x" +
          keccak256(req.body.generatedBytes, req.body.signinTime).toString(
            "hex"
          );
        console.log("old session hash", sessionHash);
        token.generatedBytes = getRandom32Bytes();
        const nextSessionHash =
          "0x" +
          keccak256(token.generatedBytes, req.body.signinTime).toString("hex");
        console.log("new session hash", token.generatedBytes);
        //////////////////////////////////signup
        await userContract
          .connect(serverWallet)
          .setUserNameOwner(
            req.body.userAddress,
            req.body.username,
            sessionHash,
            nextSessionHash
          );
        //////
        token.success = true;
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/signup", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    var token = { success: false };

    if (getTimestampInSeconds() - req.body.timestamp <= 10) {
      const msgHex = ethUtil.bufferToHex(
        Buffer.from("securetransfer" + req.body.timestamp)
      );
      const msgBuffer = ethUtil.toBuffer(msgHex);
      const msgHash = ethUtil.hashPersonalMessage(msgBuffer);

      const signature = ethUtil.toBuffer(req.body.signature);

      const sigParams = ethUtil.fromRpcSig(signature);
      const publicKey = ethUtil.ecrecover(
        msgHash,
        sigParams.v,
        sigParams.r,
        sigParams.s
      );

      const sender = ethUtil.publicToAddress(publicKey);
      const addr = ethUtil.bufferToHex(sender);

      console.log("signer recovered address", addr);
      console.log("address sent by frontend", req.body.userAddress);
      console.log(
        "match",
        addr.toLowerCase() === req.body.userAddress.toLowerCase()
      );
      if (addr.toLowerCase() === req.body.userAddress.toLowerCase()) {
        var userExists = await userContract.idByAddress(addr);
        userExists = userExists > 0;
        // console.log("signature hash", keccak256(req.body.signature).toString());
        if (!userExists) {
          const randomBytes = getRandom32Bytes();
          token.generatedBytes = randomBytes;
          token.signinTime = req.body.timestamp;

          const sessionHash =
            "0x" +
            keccak256(token.generatedBytes, token.signinTime).toString("hex");
          console.log("session hash", sessionHash);
          //////////////////////////////////signup
          await userContract
            .connect(serverWallet)
            .signupOwner(
              sessionHash,
              addr,
              req.body.data,
              req.body.dateOfBirth,
              req.body.pronoun,
              req.body.tags,
              req.body.fields,
              req.body.ownedNFT
            );
          token.success = true;
          res.json(token);
        } else {
          token.reason = "User already exists";
          console.log("User already exists");
          res.json(token);
        }
      } else {
        token.reason = "wrong signature";
        console.log("wrong signature");
        res.json(token);
      }
    } else {
      token.reason = "very old signature";
      console.log("took more than 10 secs");
      res.json(token);
    }
  } catch (error) {
    console.log("please try again", error);
    res.json("please try again");
  }
});

app.post("/signin", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    console.log("administration", await userContract.administration());

    var token = { success: false };

    if (getTimestampInSeconds() - req.body.timestamp <= 10) {
      const msgHex = ethUtil.bufferToHex(
        Buffer.from("securetransfer" + req.body.timestamp)
      );
      const msgBuffer = ethUtil.toBuffer(msgHex);
      const msgHash = ethUtil.hashPersonalMessage(msgBuffer);

      const signature = ethUtil.toBuffer(req.body.signature);

      const sigParams = ethUtil.fromRpcSig(signature);
      const publicKey = ethUtil.ecrecover(
        msgHash,
        sigParams.v,
        sigParams.r,
        sigParams.s
      );

      const sender = ethUtil.publicToAddress(publicKey);
      const addr = ethUtil.bufferToHex(sender);

      console.log("signer recovered address", addr);
      console.log("address sent by frontend", req.body.userAddress);
      console.log(
        "match",
        addr.toLowerCase() === req.body.userAddress.toLowerCase()
      );
      if (addr.toLowerCase() === req.body.userAddress.toLowerCase()) {
        // console.log("signature hash", keccak256(req.body.signature).toString());
        const randomBytes = getRandom32Bytes();
        token.generatedBytes = randomBytes;
        token.signinTime = req.body.timestamp;

        const sessionHash =
          "0x" +
          keccak256(token.generatedBytes, token.signinTime).toString("hex");
        console.log("session hash", sessionHash);
        await userContract.connect(serverWallet).signin(addr, sessionHash);
        token.success = true;
        res.json(token);
      } else {
        token.reason = "wrong signature";
        console.log("wrong signature");
        res.json(token);
      }
    } else {
      token.reason = "very old signature";
      console.log("took more than 10 secs");
      res.json(token);
    }
  } catch {
    console.log("please try again");
    res.json("please try again");
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
