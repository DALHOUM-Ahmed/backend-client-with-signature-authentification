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

const userContractAddress = "0x14C315c29371c4C8206Af7cdC6f9CeF891e39A48";
const groupContractAddress = "0xc2a357164E83F27FA83062dB136Cc039b4Ef185A";
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

app.post("/post-update-tags", async (req, res) => {
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

app.post("/post-update-title", async (req, res) => {
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

app.post("/post-update-body", async (req, res) => {
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

app.post("/post-create", async (req, res) => {
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

app.post("/post-bsc-group", async (req, res) => {
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

app.post("/post-ethereum-group", async (req, res) => {
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

// app.post("/group_update_about", async (req, res) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   try {
//     var token = { success: false, signinTime: req.body.signinTime };
//     if (
//       getTimestampInSeconds() - req.body.signinTime >=
//       sessionExpirationDelayInSeconds
//     ) {
//       token.reason = "session expired";
//       res.json(token);
//     } else {
//       const isCorrect = await verifySigninAfterExpirationCheck(req.body);
//       console.log("isCorrect", isCorrect);
//       if (isCorrect) {
//         ////Operation code
//         const sessionHash =
//           "0x" +
//           keccak256(req.body.generatedBytes, req.body.signinTime).toString(
//             "hex"
//           );
//         console.log("old session hash", sessionHash);
//         token.generatedBytes = getRandom32Bytes();
//         const nextSessionHash =
//           "0x" +
//           keccak256(token.generatedBytes, req.body.signinTime).toString("hex");
//         console.log("token", token);
//         // console.log("new session hash", token.OrigingeneratedBytes);
//         //////////////////////////////////signup

//         await groupContract
//           .connect(serverWallet)
//           .updateGroupAbout(
//             req.body.userAddress,
//             req.body.groupId,
//             req.body.about,
//             sessionHash,
//             nextSessionHash
//           );
//         //////
//         token.success = true;
//       } else {
//         token.reason = "non verified or expired token";
//       }
//       res.json(token);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });

app.post("/group-update-name", async (req, res) => {
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

app.post("/group-update", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  var token = { success: false, signinTime: req.body.signinTime };
  if (req.body.name) {
    const exists = await groupContract.checkGroupNameExist(req.body.name);
    if (exists) {
      token.reason = "Group with same name already exists";
      res.json(token);
      return;
    }
  }
  const exists = await groupContract.checkGroupExist(req.body.groupId);
  if (!exists) {
    console.log("eq.body.groupId", req.body.groupId);
    token.reason = "Group ID doesn't exist";
    res.json(token);
    return;
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
        console.log("token", token);
        // console.log("new session hash", token.OrigingeneratedBytes);
        //////////////////////////////////signup
        var updates = {
          userAddress: req.body.userAddress,
          groupId: req.body.groupId,
          data: [],
          fields: [],
        };
        if (req.body.name) {
          updates.data.push(req.body.name);
          updates.fields.push(0);
        }
        if (req.body.about) {
          updates.data.push(req.body.about);
          updates.fields.push(1);
        }
        if ("privacy" in req.body) {
          updates.fields.push(2);
        }

        await groupContract
          .connect(serverWallet)
          .updateGroup(
            updates.userAddress,
            updates.groupId,
            updates.data,
            updates.fields,
            "privacy" in req.body ? req.body.privacy : false,
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

app.post("/group-create", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  var token = { success: false, signinTime: req.body.signinTime };
  const exists = await groupContract.checkGroupNameExist(req.body.name);
  console.log("exists", exists);
  if (exists) {
    token.reason = "Group with same name already exists";
    res.json(token);
    return;
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
        console.log("token", token);
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

app.post("/update-user", async (req, res) => {
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
        var updates = {
          userAddress: req.body.userAddress,
          data: [],
          dateOfBirth: req.body.dateOfBirth ? req.body.dateOfBirth : 0,
          pronoun: req.body.pronoun ? req.body.pronoun : 0,
          tags: req.body.tags ? req.body.tags : [],
          fields: [],
          ownedNFT: req.body.ownedNFT
            ? req.body.ownedNFT
            : ["0x0000000000000000000000000000000000000000", 0],
        };
        if (req.body.firstname) {
          updates.data.push(req.body.firstname);
          updates.fields.push(0);
        }
        if (req.body.middlename) {
          updates.data.push(req.body.middlename);
          updates.fields.push(1);
        }
        if (req.body.lastname) {
          updates.data.push(req.body.lastname);
          updates.fields.push(2);
        }
        if (req.body.username) {
          var id = await userContract.idByUserName(req.body.username);
          if (id.gt(0)) {
            console.log("token", token);
            token.reason = "existing username";
            delete token.generatedBytes;
            res.json(token);
            return;
          }
          updates.data.push(req.body.username);
          updates.fields.push(3);
        }
        if (req.body.backgroundColor) {
          updates.data.push(req.body.backgroundColor);
          updates.fields.push(4);
        }
        if (req.body.discord) {
          updates.data.push(req.body.discord);
          updates.fields.push(5);
        }
        if (req.body.instagram) {
          updates.data.push(req.body.instagram);
          updates.fields.push(6);
        }
        if (req.body.twitter) {
          updates.data.push(req.body.twitter);
          updates.fields.push(7);
        }
        if (req.body.tiktok) {
          updates.data.push(req.body.tiktok);
          updates.fields.push(8);
        }
        if (req.body.uploadedPictureUrl) {
          updates.data.push(req.body.uploadedPictureUrl);
          updates.fields.push(9);
        }
        if (req.body.email) {
          updates.data.push(req.body.email);
          updates.fields.push(10);
        }
        if (req.body.bio) {
          updates.data.push(req.body.bio);
          updates.fields.push(11);
        }
        if (req.body.telephone) {
          updates.data.push(req.body.telephone);
          updates.fields.push(12);
        }
        if (req.body.govid) {
          updates.data.push(req.body.govid);
          updates.fields.push(13);
        }
        if (req.body.fingerscan) {
          updates.data.push(req.body.fingerscan);
          updates.fields.push(14);
        }
        if (req.body.tags) {
          updates.tags = req.body.tags;
          updates.fields.push(15);
        }
        if (req.body.ownedNFT) {
          updates.ownedNFT = req.body.ownedNFT;
          updates.fields.push(16);
        }
        if (req.body.dateOfBirth) {
          updates.dateOfBirth = req.body.dateOfBirth;
          updates.fields.push(17);
        }
        if (req.body.pronoun) {
          updates.pronoun = req.body.pronoun;
          updates.fields.push(18);
        }

        console.log("updates", updates);

        await userContract
          .connect(serverWallet)
          .updateBatch(
            updates.userAddress,
            updates.data,
            updates.dateOfBirth,
            updates.pronoun,
            updates.tags,
            updates.fields,
            updates.ownedNFT,
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

  var token = { success: false };
  if (!req.body.username || !req.body.userAddress) {
    console.log("username", req.body.username);
    console.log("userAddress", req.body.userAddress);
    console.log("req.body", req.body);
    token.reason = "missing necessary fields";
    res.json(token);
  } else {
    var id = await userContract.idByUserName(req.body.username);
    console.log("corresponding id", id);

    if (id.gt(0)) {
      token.reason = "existing username and/or account address";
      console.log("existing username");
      res.json(token);
    } else {
      id = await userContract.idByAddress(req.body.userAddress);
      if (id.gt(0)) {
        token.reason = "existing address";
        console.log("address already used");
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

              var updates = {
                userAddress: req.body.userAddress,
                data: [],
                dateOfBirth: req.body.dateOfBirth ? req.body.dateOfBirth : 0,
                pronoun: req.body.pronoun ? req.body.pronoun : 0,
                tags: req.body.tags ? req.body.tags : [],
                fields: [],
                ownedNFT: req.body.ownedNFT
                  ? req.body.ownedNFT
                  : ["0x0000000000000000000000000000000000000000", 0],
              };
              if (req.body.firstname) {
                updates.data.push(req.body.firstname);
                updates.fields.push(0);
              }
              if (req.body.middlename) {
                updates.data.push(req.body.middlename);
                updates.fields.push(1);
              }
              if (req.body.lastname) {
                updates.data.push(req.body.lastname);
                updates.fields.push(2);
              }
              if (req.body.username) {
                updates.data.push(req.body.username);
                updates.fields.push(3);
              }
              if (req.body.backgroundColor) {
                updates.data.push(req.body.backgroundColor);
                updates.fields.push(4);
              }
              if (req.body.discord) {
                updates.data.push(req.body.discord);
                updates.fields.push(5);
              }
              if (req.body.instagram) {
                updates.data.push(req.body.instagram);
                updates.fields.push(6);
              }
              if (req.body.twitter) {
                updates.data.push(req.body.twitter);
                updates.fields.push(7);
              }
              if (req.body.tiktok) {
                updates.data.push(req.body.tiktok);
                updates.fields.push(8);
              }
              if (req.body.uploadedPictureUrl) {
                updates.data.push(req.body.uploadedPictureUrl);
                updates.fields.push(9);
              }
              if (req.body.email) {
                updates.data.push(req.body.email);
                updates.fields.push(10);
              }
              if (req.body.bio) {
                updates.data.push(req.body.bio);
                updates.fields.push(11);
              }
              if (req.body.telephone) {
                updates.data.push(req.body.telephone);
                updates.fields.push(12);
              }
              if (req.body.govid) {
                updates.data.push(req.body.govid);
                updates.fields.push(13);
              }
              if (req.body.fingerscan) {
                updates.data.push(req.body.fingerscan);
                updates.fields.push(14);
              }
              if (req.body.tags) {
                updates.tags = req.body.tags;
                updates.fields.push(15);
              }
              if (req.body.ownedNFT) {
                updates.ownedNFT = req.body.ownedNFT;
                updates.fields.push(16);
              }
              if (req.body.dateOfBirth) {
                updates.dateOfBirth = req.body.dateOfBirth;
                updates.fields.push(17);
              }
              if (req.body.pronoun) {
                updates.pronoun = req.body.pronoun;
                updates.fields.push(18);
              }

              console.log("updates", updates);

              await userContract
                .connect(serverWallet)
                .signup(
                  sessionHash,
                  addr,
                  updates.data,
                  updates.dateOfBirth,
                  updates.pronoun,
                  updates.tags,
                  updates.fields,
                  updates.ownedNFT
                );
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
