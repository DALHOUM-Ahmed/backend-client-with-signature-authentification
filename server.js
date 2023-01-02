require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const keccak256 = require("keccak256");
const cors = require("cors");
const bodyParser = require("body-parser");
const ethUtil = require("ethereumjs-util");
const userAbi = require("./ABIs/user.json");
const groupAbi = require("./ABIs/group.json");
const postAbi = require("./ABIs/post.json");
const { randomBytes } = require("crypto");

const ethereumProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);
const bscProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/bsc"
);

const sessionExpirationDelayInSeconds = 2628288;
const signatureLifeTimeInSeconds = 3600; //one hour

const userContractAddress = "0x16e2Bc10b42a9B03DA8b5E0476333d2874dA8d9e";
const groupContractAddress = "0x5FFd8a50A87B5B1a6429819C1eDFcC6F23D2E958";
const postContractAddress = "0x26E60aA320e93F6CE092D6c242697d8876129BAb";
const ethThresholdToPostInEthGroup = 0.1;
const bnbThresholdToPostInBscGroup = 0.1;

const provider = new ethers.providers.JsonRpcProvider(
  "https://testnet.aurora.dev"
);
const userContract = new ethers.Contract(
  userContractAddress,
  userAbi,
  provider
);
const groupContract = new ethers.Contract(
  groupContractAddress,
  groupAbi,
  provider
);

const postContract = new ethers.Contract(
  postContractAddress,
  postAbi,
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

app.post("/post_update_tags", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        if (req.body.tags.length === 0) {
          token.reason = "tags field array is required to have values"; // more checks should be added
        }
        if (!token.reason) {
          try {
            await postContract
              .connect(serverWallet)
              .updateTags(
                req.body.userAddress,
                req.body.postId,
                req.body.tags,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } catch (err) {
            console.log("error", err);
            token.reason = "please verify if you are authorized to change this";
          }
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/post_update_title", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        if (req.body.title === "") {
          token.reason = "title field is required"; // more checks should be added
        }
        if (!token.reason) {
          try {
            await postContract
              .connect(serverWallet)
              .updateTitle(
                req.body.userAddress,
                req.body.postId,
                req.body.title,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } catch (err) {
            console.log("error", err);
            token.reason = "please verify if you are authorized to change this";
          }
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/post_update_body", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        if (req.body.body === "") {
          token.reason = "body field is required";
        }
        if (!token.reason) {
          try {
            await postContract
              .connect(serverWallet)
              .updateBody(
                req.body.userAddress,
                req.body.postId,
                req.body.body,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } catch (err) {
            console.log("error", err);
            token.reason = "please verify if you are authorized to change this";
          }
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

//"please verify if you are authorized to change this, please report the problem if you are sure (you are the post author, group admin)"

app.post("/post_create", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        //check that eth balance is >= than amount
        const balance = await bscProvider.getBalance(req.body.userAddress);
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`balance: ${balanceInEth} ETH`);
        if (balanceInEth < ethThresholdToPostInEthGroup) {
          token.reason = "eth balance < " + ethThresholdToPostInEthGroup;
        } else if (req.body.title === "" || req.body.body === "") {
          token.reason = "title/body required";
        } else if (req.body.groupId <= 2) {
          token.reason = "different endpoint to post in eth/bsc groups";
        }
        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .makePost(
              req.body.userAddress,
              req.body.title,
              req.body.body,
              req.body.groupId,
              req.body.tags,
              sessionHash,
              nextSessionHash
            );
          //////
          token.success = true;
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/post_bsc_group", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        //check that eth balance is >= than amount
        const balance = await bscProvider.getBalance(req.body.userAddress);
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`balance: ${balanceInEth} ETH`);
        if (balanceInEth < ethThresholdToPostInEthGroup) {
          token.reason = "eth balance < " + ethThresholdToPostInEthGroup;
        } else if (req.body.title === "" || req.body.body === "") {
          token.reason = "title/body required";
        }
        if (!token.reason) {
          await postContract.connect(serverWallet).makePost(
            req.body.userAddress,
            req.body.title,
            req.body.body,
            2, //second group is bsc
            req.body.tags,
            sessionHash,
            nextSessionHash
          );
          token.success = true;
          //////
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/post_ethereum_group", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);

        //check that eth balance is >= than amount
        const balance = await ethereumProvider.getBalance(req.body.userAddress);
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`balance: ${balanceInEth} ETH`);
        if (balanceInEth < ethThresholdToPostInEthGroup) {
          token.reason = "eth balance < " + ethThresholdToPostInEthGroup;
        } else if (req.body.title === "" || req.body.body === "") {
          token.reason = "title/body required";
        }
        if (!token.reason) {
          await postContract.connect(serverWallet).makePost(
            req.body.userAddress,
            req.body.title,
            req.body.body,
            1, //first group is bsc
            req.body.tags,
            sessionHash,
            nextSessionHash
          );
          //////
          token.success = true;
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/group_update_about", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);
        //////////////////////////////////signup

        await groupContract
          .connect(serverWallet)
          .updateGroupAbout(
            req.body.userAddress,
            req.body.groupId,
            req.body.about,
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

app.post("/group_update_name", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);
        //////////////////////////////////signup

        await groupContract
          .connect(serverWallet)
          .updateGroupName(
            req.body.userAddress,
            req.body.groupId,
            req.body.name,
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

app.post("/group_create", async (req, res) => {
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);
        //////////////////////////////////signup

        await groupContract
          .connect(serverWallet)
          .createGroup(
            req.body.userAddress,
            req.body.name,
            req.body.about,
            req.body.private,
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

app.post("/check-signin", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const id = await userContract.idByAddress(req.body.userAddress);
  var token = { success: false };
  if (id == 0) {
    console.log("non existing account");
    token.reason = "account doesn't exist";
    res.json(token);
  } else {
    try {
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
  }
});

app.post("/update-username", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  var id = await userContract.idByUserName(req.body.username);
  var token = { success: false, signinTime: req.body.signinTime };
  console.log("corresponding id", id);
  if (id.gt(0)) {
    token.reason = "existing username";
    console.log("existing username");
  }
  try {
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
        if (!token.reason) {
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
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/update-firstname", async (req, res) => {
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
          .setFirstNameOwner(
            req.body.userAddress,
            req.body.firstname,
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

app.post("/update-middlename", async (req, res) => {
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
          .setMiddleNameOwner(
            req.body.userAddress,
            req.body.middlename,
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

app.post("/update-backgroundcolor", async (req, res) => {
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
          .setBackgroundColorOwner(
            req.body.userAddress,
            req.body.backgroundColor,
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

app.post("/update-dateofbirth", async (req, res) => {
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
          .setDateOfBirthOwner(
            req.body.userAddress,
            req.body.dateOfBirth,
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

app.post("/update-instagram", async (req, res) => {
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
          .setInstagramOwner(
            req.body.userAddress,
            req.body.instagram,
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

app.post("/update-tiktok", async (req, res) => {
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
          .setTiktokOwner(
            req.body.userAddress,
            req.body.tiktok,
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

app.post("/update-twitter", async (req, res) => {
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
          .setTwitterOwner(
            req.body.userAddress,
            req.body.twitter,
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

app.post("/update-lastname", async (req, res) => {
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
          .setLastNameOwner(
            req.body.userAddress,
            req.body.lastname,
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

app.post("/update-email", async (req, res) => {
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
          .setEmailOwner(
            req.body.userAddress,
            req.body.email,
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

app.post("/update-tags", async (req, res) => {
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
          .setTagsOwner(
            req.body.userAddress,
            req.body.tags,
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

app.post("/update-nft", async (req, res) => {
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
          .setPictureNFTOwner(
            req.body.userAddress,
            req.body.nft,
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

app.post("/update-uploadedpicture", async (req, res) => {
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
          .setPictureUploadOwner(
            req.body.userAddress,
            req.body.pictureupload,
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

app.post("/update-phonenumber", async (req, res) => {
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
          .setTelephoneOwner(
            req.body.userAddress,
            req.body.phonenumber,
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

app.post("/update-govid", async (req, res) => {
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
          .setGovtIDOwner(
            req.body.userAddress,
            req.body.govid,
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

app.post("/update-fingerscan", async (req, res) => {
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
          .setFingerScanOwner(
            req.body.userAddress,
            req.body.fingerscan,
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

app.post("/update-phoneverifieddata", async (req, res) => {
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
          .setTelephoneVerifiedDataOwner(
            req.body.userAddress,
            req.body.phoneverifieddata,
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

app.post("/update-emailverifieddata", async (req, res) => {
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
          .setEmailVerifiedDataOwner(
            req.body.userAddress,
            req.body.emailverifieddata,
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
  var id = await userContract.idByUserName(
    req.body.data[req.body.fields.findIndex((e) => e == 3)]
  );
  console.log("corresponding id", id);
  var token = { success: false };
  if (id.gt(0)) {
    token.reason = "existing username and/or account address and/or email";
    console.log("existing username");
    res.json(token);
  } else {
    id = await userContract.idByAddress(req.body.userAddress);
    if (id.gt(0)) {
      token.reason = "existing address and/or email";
      console.log("address already used");
      res.json(token);
    } else {
      id = await userContract.idByEmail(
        req.body.data[req.body.fields.findIndex((e) => e == 11)]
      );
      console.log(
        "email",
        req.body.data[req.body.fields.findIndex((e) => e == 11)]
      );
      if (id.gt(0)) {
        token.reason = "existing email";
        console.log("email already used");
        res.json(token);
      } else {
        try {
          if (
            getTimestampInSeconds() - req.body.timestamp <=
            signatureLifeTimeInSeconds
          ) {
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
                  keccak256(token.generatedBytes, token.signinTime).toString(
                    "hex"
                  );
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
      }
    }
  }
});

app.post("/signin", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const id = await userContract.idByAddress(req.body.userAddress);
  console.log("corresponding id", id);
  var token = { success: false };
  if (id == 0) {
    console.log("non existing account");
    token.reason = "account doesn't exist";
    res.json(token);
  } else {
    try {
      if (
        getTimestampInSeconds() - req.body.timestamp <=
        signatureLifeTimeInSeconds
      ) {
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
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
