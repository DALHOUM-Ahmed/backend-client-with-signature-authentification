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
const reportAbi = require("./ABIs/report.json");
const AWS = require("aws-sdk");
const { randomBytes } = require("crypto");
const axios = require("axios");

const ethereumProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);
const bscProvider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/bsc"
);

const sessionExpirationDelayInSeconds = 2628288;
const signatureLifeTimeInSeconds = 2628288; //one month

const userContractAddress = "0xF8B5876cDa91d8161090a1d7ae6A42B73657AF1f"; //"0x268362600dC0f43e04870eE3fD994DDc5Ba699d0";
const groupContractAddress = "0x51DB41a157E5790C83ee3E2D8a04d5145f43D04b";
const postContractAddress = "0x5B5D4C90CdFc446274CfF655D529AA9338535576";
const reportContractAddress = "0xF503b7229a1EebefCb0A702D8aA810e2d3569933";

const ethThresholdToPostInEthGroup = 0.1;
const bnbThresholdToPostInBscGroup = 0.1;

const provider = new ethers.providers.JsonRpcProvider(
  "https://galaxy.block.caduceus.foundation"
);

const s3 = new AWS.S3({
  accessKeyId: "5DD0DF9473A8601DA825",
  secretAccessKey: "1UwruvMP0k5Wqz3Xtb6wBHBxB6X6Tx6vRFYawQcj",
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  signatureVersion: "v4",
});
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

const reportContract = new ethers.Contract(
  reportContractAddress,
  reportAbi,
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

function getReporterBytesForId(userAddress, objectId) {
  return (
    "0x" +
    keccak256(process.env.DEME_REPORT_SEED, userAddress, objectId).toString(
      "hex"
    )
  );
}

async function getUserStatus(userAddress) {
  const result = await axios({
    url: "http://ec2-3-101-116-139.us-west-1.compute.amazonaws.com:8000/subgraphs/name/deme/testnet-subgraph",
    method: "post",
    data: {
      query: `
        {
            users(where: {userAddress: "${userAddress.toLowerCase()}"}, subgraphError: allow) {
              status
            }
          }
          `,
    },
  });
  return result.data.data.users[0].status;
}

//verify sessionExpirationDelayInSeconds before to be able to return session expiration reason
async function verifySigninAfterExpirationCheck(token) {
  const sessionHash =
    "0x" + keccak256(token.generatedBytes, token.signinTime).toString("hex");

  console.log("sessionHash", sessionHash);
  const signedAddress = await userContract.getSignedUser(sessionHash);
  console.log(
    "signed user",
    signedAddress.toLowerCase() == token.userAddress.toLowerCase()
  );
  return signedAddress.toLowerCase() == token.userAddress.toLowerCase();
}

async function uploadNftPost(postMetadata, userID, subfolder) {
  const params = {
    Bucket: "deme-test-users",
    Key: `users/${userID}/${subfolder}/${getTimestampInSeconds()}.json`,
    Body: JSON.stringify(postMetadata),
  };
  const request = s3.putObject(params);
  let cid = (await request.promise()).$response.httpResponse.headers[
    "x-amz-meta-cid"
  ];

  return cid;
}

app.post("/post/report", async (req, res) => {
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

        if (req.body.postID === undefined) {
          token.reason = "missing postID";
          res.json(token);
          return;
        }
        if (req.body.report === undefined) {
          token.reason = "missing report(true/false) attribute";
          res.json(token);
          return;
        }

        const reporterBytes = getReporterBytesForId(
          req.body.userAddress,
          req.body.postID
        );
        if (!token.reason) {
          await reportContract
            .connect(serverWallet)
            .reportPost(
              reporterBytes,
              req.body.postID,
              req.body.report,
              req.body.reason ? req.body.reason : ""
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
    // token.reason = err;
    // console.log(err);
    // res.json(token);
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/report", async (req, res) => {
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

        if (req.body.commentID === undefined) {
          token.reason = "missing commentID";
          res.json(token);
          return;
        }
        if (req.body.report === undefined) {
          token.reason = "missing report(true/false) attribute";
          res.json(token);
          return;
        }

        const reporterBytes = getReporterBytesForId(
          req.body.userAddress,
          req.body.commentID
        );
        if (!token.reason) {
          await reportContract
            .connect(serverWallet)
            .reportComment(
              reporterBytes,
              req.body.commentID,
              req.body.report,
              req.body.reason ? req.body.reason : ""
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
    // token.reason = err;
    // console.log(err);
    // res.json(token);
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/reply/report", async (req, res) => {
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

        if (req.body.replyID === undefined) {
          token.reason = "missing replyID";
          res.json(token);
          return;
        }
        if (req.body.report === undefined) {
          token.reason = "missing report(true/false) attribute";
          res.json(token);
          return;
        }

        const reporterBytes = getReporterBytesForId(
          req.body.userAddress,
          req.body.replyID
        );
        if (!token.reason) {
          await reportContract
            .connect(serverWallet)
            .reportReply(
              reporterBytes,
              req.body.replyID,
              req.body.report,
              req.body.reason ? req.body.reason : ""
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
    // token.reason = err;
    // console.log(err);
    // res.json(token);
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/reply/flaglikeUnlike", async (req, res) => {
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

        if (req.body.replyID === undefined) {
          token.reason = "missing replyID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          if (req.body.like === 1) {
            await postContract
              .connect(serverWallet)
              .addReplyLike(
                req.body.userAddress,
                req.body.replyID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else if (req.body.like === 0) {
            await postContract
              .connect(serverWallet)
              .removeReplyLike(
                req.body.userAddress,
                req.body.replyID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else {
            token.reason = "like attribute can only be 0/1";
            res.json(token);
            return;
          }
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    // token.reason = err;
    // console.log(err);
    // res.json(token);
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/flaglikeUnlike", async (req, res) => {
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

        if (req.body.commentID === undefined) {
          token.reason = "missing commentID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          if (req.body.like === 1) {
            await postContract
              .connect(serverWallet)
              .addCommentLike(
                req.body.userAddress,
                req.body.commentID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else if (req.body.like === 0) {
            await postContract
              .connect(serverWallet)
              .removeCommentLike(
                req.body.userAddress,
                req.body.commentID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else {
            token.reason = "like attribute can only be 0/1";
            res.json(token);
            return;
          }
        } else {
          token.reason = "non verified or expired token";
        }
        res.json(token);
      }
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/hide", async (req, res) => {
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

        if (req.body.postID === undefined) {
          token.reason = "missing postID";
          res.json(token);
          return;
        }
        if (!token.reason) {
          if (req.body.author === 1) {
            await postContract
              .connect(serverWallet)
              .authorHidePost(
                req.body.userAddress,
                req.body.postID,
                sessionHash,
                nextSessionHash
              );
            token.success = true;
          } else if (req.body.author === 0) {
            await postContract
              .connect(serverWallet)
              .adminHidePost(
                req.body.userAddress,
                req.body.postID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else {
            token.reason = "author attribute can only be 0/1";
            res.json(token);
            return;
          }

          //////
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/flaglikeUnlike", async (req, res) => {
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

        if (req.body.postID === undefined) {
          token.reason = "missing postID";
          res.json(token);
          return;
        }
        if (!token.reason) {
          if (req.body.like === 1) {
            await postContract
              .connect(serverWallet)
              .addPostLike(
                req.body.userAddress,
                req.body.postID,
                sessionHash,
                nextSessionHash
              );
            token.success = true;
          } else if (req.body.like === 0) {
            await postContract
              .connect(serverWallet)
              .removePostLike(
                req.body.userAddress,
                req.body.postID,
                sessionHash,
                nextSessionHash
              );
            //////
            token.success = true;
          } else {
            token.reason = "like attribute can only be 0/1";
            res.json(token);
            return;
          }

          //////
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/reply/update", async (req, res) => {
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

        if (!req.body.body) {
          token.reason = "comment should have a body";
          res.json(token);
          return;
        }
        if (req.body.replyID === undefined) {
          token.reason = "missing replyID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .editReply(
              req.body.userAddress,
              req.body.replyID,
              req.body.body,
              [
                req.body.taggedPeople ? req.body.taggedPeople : [],
                req.body.taggedGroups ? req.body.taggedGroups : [],
              ],
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/reply/create", async (req, res) => {
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

        if (!req.body.body) {
          token.reason = "comment should have a body";
          res.json(token);
          return;
        }
        if (req.body.commentID === undefined) {
          token.reason = "missing commentID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .addReply(
              req.body.userAddress,
              req.body.commentID,
              req.body.body,
              [
                req.body.taggedPeople ? req.body.taggedPeople : [],
                req.body.taggedGroups ? req.body.taggedGroups : [],
              ],
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/update", async (req, res) => {
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

        if (!req.body.body) {
          token.reason = "comment should have a body";
          res.json(token);
          return;
        }
        if (req.body.commentID === undefined) {
          token.reason = "missing commentID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .editComment(
              req.body.userAddress,
              req.body.commentID,
              req.body.body,
              [
                req.body.taggedPeople ? req.body.taggedPeople : [],
                req.body.taggedGroups ? req.body.taggedGroups : [],
              ],
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/comment/create", async (req, res) => {
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

        if (!req.body.body) {
          token.reason = "comment should have a body";
          res.json(token);
          return;
        }
        if (req.body.postID === undefined) {
          token.reason = "missing postID";
          res.json(token);
          return;
        }

        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .addComment(
              req.body.userAddress,
              req.body.postID,
              req.body.body,
              [
                req.body.taggedPeople ? req.body.taggedPeople : [],
                req.body.taggedGroups ? req.body.taggedGroups : [],
              ],
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/update", async (req, res) => {
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
        let type;
        if (req.body.type === "NFT") type = 0;
        else if (req.body.type === "Video") type = 1;
        else if (req.body.type === "Photo") type = 2;
        else if (req.body.type === "Caption") type = 3;
        let taggedElements = [];
        var fieldsToUpdate = {
          userAddress: req.body.userAddress,
          postID: req.body.postID,
          post: [],
          updatedFields: [],
          numberOfUpdatedFields: 0,
        };

        fieldsToUpdate.post.push(req.body.userAddress);
        if (req.body.title) {
          fieldsToUpdate.post.push(req.body.title);
          fieldsToUpdate.updatedFields.push(0);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }
        if (req.body.body) {
          fieldsToUpdate.post.push(req.body.body);
          fieldsToUpdate.updatedFields.push(1);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }
        if (req.body.CIDAsset) {
          fieldsToUpdate.post.push(req.body.CIDAsset);
          fieldsToUpdate.updatedFields.push(2);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }
        if (type !== undefined) {
          fieldsToUpdate.post.push(type);
          fieldsToUpdate.updatedFields.push(3);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }
        if (req.body.tags) {
          fieldsToUpdate.post.push(req.body.tags);
          fieldsToUpdate.updatedFields.push(4);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }

        if (req.body.backgroundColor) {
          fieldsToUpdate.post.push(req.body.backgroundColor);
          fieldsToUpdate.updatedFields.push(5);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          fieldsToUpdate.post.push("");
        }
        if (req.body.taggedPeople) {
          taggedElements.push(req.body.taggedPeople);
          fieldsToUpdate.updatedFields.push(6);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          taggedElements.push([]);
        }
        if (req.body.taggedGroups) {
          taggedElements.push(req.body.taggedGroups);
          fieldsToUpdate.updatedFields.push(7);
          fieldsToUpdate.numberOfUpdatedFields++;
        } else {
          taggedElements.push([]);
        }

        const post = await getPostByID(req.body.postID);
        let uri = "";
        if (post.isNFT) {
          const user = await getUserByAddress(req.body.userAddress);
          const metadata = {
            name: "#DEM3 post",
            description: `DEM3 post created by: ${user.userName}`,
            animation_url: req.body.CIDAsset ? post.CIDAsset : "",
            image: req.body.CIDAsset ? post.CIDAsset : "",
            attributes: [
              {
                name: "title",
                value: req.body.title ? req.body.title : post.title,
              },
              {
                name: "body",
                value: req.body.body ? req.body.body : post.body,
              },
              {
                name: "tags",
                value: req.body.tags ? req.body.tags : post.tags,
              },
              {
                name: "owner address",
                value: req.body.userAddress,
              },
            ],
          };
          uri = await uploadNftPost(metadata, user.id, "posts");
        }

        fieldsToUpdate.post.push(taggedElements);
        fieldsToUpdate.post.push(0); //req.body.groupID
        fieldsToUpdate.post.push(0);
        fieldsToUpdate.post.push(0);
        fieldsToUpdate.post.push(0);
        fieldsToUpdate.post.push([]);
        fieldsToUpdate.post.push(false);

        console.log(
          "fieldsToUpdate.updatedFields",
          fieldsToUpdate.updatedFields
        );
        // console.log("fieldsToUpdate.userAddress", fieldsToUpdate.userAddress);
        // console.log("fieldsToUpdate.post", fieldsToUpdate.post);
        // console.log(
        //   "fieldsToUpdate.numberOfUpdatedFields",
        //   fieldsToUpdate.numberOfUpdatedFields
        // );
        // console.log("fieldsToUpdate.post", fieldsToUpdate.post);
        // console.log("sessionHash", sessionHash);
        // console.log("nextSessionHash", nextSessionHash);
        if (!token.reason) {
          await postContract
            .connect(serverWallet)
            .updatePost(
              fieldsToUpdate.userAddress,
              fieldsToUpdate.postID,
              uri,
              fieldsToUpdate.post,
              fieldsToUpdate.updatedFields,
              fieldsToUpdate.numberOfUpdatedFields,
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/poll/flagAddRemoveVote", async (req, res) => {
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

        if (!token.reason) {
          if (req.body.addVote === 1) {
            await postContract
              .connect(serverWallet)
              .addVote(
                req.body.userAddress,
                req.body.postID,
                req.body.option,
                sessionHash,
                nextSessionHash
              );
          } else {
            await postContract
              .connect(serverWallet)
              .removeVote(
                req.body.userAddress,
                req.body.postID,
                req.body.option,
                req.body.voteID,
                sessionHash,
                nextSessionHash
              );
          }

          //////
          token.success = true;
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

//"please verify if you are authorized to change this, please report the problem if you are sure (you are the post author, group admin)"
async function getUserByAddress(userAddress) {
  const result = await axios({
    url: "http://ec2-3-101-116-139.us-west-1.compute.amazonaws.com:8000/subgraphs/name/deme/testnet-subgraph",
    method: "post",
    data: {
      query: `
      {
          users(where: {userAddress: "${userAddress.toLowerCase()}"}, orderBy: id, orderDirection: desc) {
            userName
            id
            numberOfMintedPosts
          }
        }
        `,
    },
  });
  return result.data.data.users[0];
}

async function getPostByID(postID) {
  const result = await axios({
    url: "http://ec2-3-101-116-139.us-west-1.compute.amazonaws.com:8000/subgraphs/name/deme/testnet-subgraph",
    method: "post",
    data: {
      query: `
      {
          post(id: ${postID}) {
            title
            body
            tags
            isNFT
          }
        }
        `,
    },
  });
  return result.data.data.post[0];
}

app.post("/user/readkey", async (req, res) => {
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

        if (!token.reason) {
          await userContract
            .connect(serverWallet)
            .setReadKey(
              req.body.userAddress,
              req.body.readKey,
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/user/status", async (req, res) => {
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

        if (!token.reason) {
          console.log(
            req.body.userAddress,
            req.body.status == false ? false : true,
            true,
            sessionHash
          );
          console.log("executing..");

          await userContract
            .connect(serverWallet)
            .setStatus(
              req.body.userAddress,
              req.body.status == false ? false : true,
              true,
              sessionHash
            );
          console.log("execution success");
          //////
          token.success = true;
        }
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/group/addmembers", async (req, res) => {
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

        if (!token.reason) {
          await groupContract
            .connect(serverWallet)
            .mintBatch(
              req.body.userAddress,
              req.body.addedUsers,
              req.body.groupID,
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/post/create", async (req, res) => {
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
        // const balance = await bscProvider.getBalance(req.body.userAddress);
        // const balanceInEth = ethers.utils.formatEther(balance);
        // console.log(`balance: ${balanceInEth} ETH`);
        // if (balanceInEth < ethThresholdToPostInEthGroup) {
        //   token.reason = "eth balance < " + ethThresholdToPostInEthGroup;
        // } else if (req.body.title === "" || req.body.body === "") {
        //   token.reason = "title/body required";
        // } else if (req.body.groupId <= 2) {
        //   token.reason = "different endpoint to post in eth/bsc groups";
        // }
        let type;
        let captionType = 0;
        if (req.body.type === "Video") type = 0;
        else if (req.body.type === "Photo") type = 1;
        else if (req.body.type === "Caption") {
          type = 2;
          if (req.body.captionType === "Announcement") {
            captionType = 1;
          } else if (req.body.captionType === "Opinion") {
            captionType = 2;
          } else if (req.body.captionType === "Challenge") {
            captionType = 3;
          } else if (req.body.captionType === "Trending") {
            captionType = 4;
          } else if (req.body.captionType === "Poll") {
            captionType = 5;
            if (
              !(req.body.pollOptions && Array.isArray(req.body.pollOptions) > 0)
            ) {
              token.reason = "Poll is missing options";
              res.json(token);
              return;
            }
          } else if (req.body.captionType === "Fact") {
            captionType = 6;
          } else {
            token.reason = "wrong caption type";
            res.json(token);
            return;
          }
        } else {
          token.reason = "wrong type";
          res.json(token);
          return;
        }
        console.log(1448);

        const taggedPeople = req.body.taggedPeople ? req.body.taggedPeople : [];
        const taggedGroups = req.body.taggedGroups ? req.body.taggedGroups : [];
        const post = [
          req.body.userAddress,
          req.body.title,
          req.body.body ? req.body.body : "",
          req.body.CIDAsset ? req.body.CIDAsset : "",
          type,
          req.body.tags,
          req.body.backgroundColor,
          [taggedPeople, taggedGroups],
          req.body.groupID ? req.body.groupID : 0,
          0,
          0,
          captionType,
          req.body.pollOptions ? req.body.pollOptions : [],
          req.body.singleOption ? req.body.singleOption : false,
          req.body.isNFT ? true : false,
        ];

        let nftURI = "";
        let groupURI = "";
        if (req.body.isNFT) {
          let user = await getUserByAddress(req.body.userAddress);
          let postMetadata = {
            name: "#DEM3 post",
            description: `DEM3 post created by: ${user.userName}`,
            animation_url: req.body.CIDAsset ? req.body.CIDAsset : "",
            image: req.body.CIDAsset ? "ipfs://" + req.body.CIDAsset : "",
            attributes: [
              {
                name: "title",
                value: req.body.title,
              },
              {
                name: "body",
                value: req.body.body ? req.body.body : "",
              },
              {
                name: "tags",
                value: req.body.tags,
              },
              {
                name: "owner address",
                value: req.body.userAddress,
              },
            ],
          };
          nftURI = await uploadNftPost(postMetadata, user.id, "posts");
          ///test
          // let postMetadata = {
          //   name: "#DEM3 post",
          //   description: `DEM3 post created by: ${"Ahmed"}`,
          //   animation_url: req.body.CIDAsset ? req.body.CIDAsset : "",
          //   image: req.body.CIDAsset ? "ipfs://" + req.body.CIDAsset : "",
          //   attributes: [
          //     {
          //       name: "title",
          //       value: req.body.title,
          //     },
          //     {
          //       name: "body",
          //       value: req.body.body ? req.body.body : "",
          //     },
          //     {
          //       name: "tags",
          //       value: req.body.tags,
          //     },
          //     {
          //       name: "owner address",
          //       value: req.body.userAddress,
          //     },
          //   ],
          // };

          // nftURI = await uploadNftPost(postMetadata, 0, "posts");
          nftURI = "ipfs://" + nftURI;

          if (req.body.isGroup) {
            let groupNFTMetadata = {
              name: "#DEM3 membership for group " + req.body.title,
              description: req.body.description ? req.body.description : "",
              animation_url: req.body.CIDAsset ? req.body.CIDAsset : "",
              image: req.body.CIDAsset ? "ipfs://" + req.body.CIDAsset : "",
              attributes: [
                {
                  name: "name",
                  value: req.body.title,
                },
                {
                  name: "about",
                  value: req.body.body,
                },
                {
                  name: "tags",
                  value: req.body.tags,
                },
                {
                  name: "privacy",
                  value: req.body.private ? "private" : "public",
                },
              ],
            };

            groupURI = await uploadNftPost(
              groupNFTMetadata,
              user.id,
              "createdGroups"
            );
            groupURI = "ipfs://" + groupURI;
          }
        }

        const groupsSpecifications = [
          req.body.isGroup && req.body.isNFT ? req.body.isGroup : false,
          req.body.private && req.body.isNFT ? req.body.private : false,
        ];
        if (!token.reason) {
          console.log(
            "params",
            post,
            [
              nftURI,
              groupURI,
              req.body.description ? req.body.description : "",
            ],
            groupsSpecifications,
            sessionHash,
            nextSessionHash
          );
          await postContract
            .connect(serverWallet)
            .makePost(
              post,
              [
                nftURI,
                groupURI,
                req.body.description ? req.body.description : "",
              ],
              groupsSpecifications,
              sessionHash,
              nextSessionHash,
              {
                gasLimit: 100000000,
              }
            );

          console.log("post created");
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
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

app.post("/user/flagFollowUnfollow", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  var token = { success: false, signinTime: req.body.signinTime };

  const followedUserAddress = await userContract.addressById(
    req.body.followedUserID
  );
  if (followedUserAddress == "0x0000000000000000000000000000000000000000") {
    token.reason = "non registered followed user";
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
        if (req.body.followedUserID === undefined) {
          token.reason = "undefined followedUserID";
          res.json(token);
          return;
        }
        console.log("before userid");
        const userId = await userContract.idByAddress(req.body.userAddress);

        console.log("userId", userId);
        if (req.body.follow === 1) {
          await userContract
            .connect(serverWallet)
            .follow(
              userId,
              req.body.followedUserID,
              sessionHash,
              nextSessionHash
            );
        } else if (req.body.follow === 0) {
          await userContract
            .connect(serverWallet)
            .unFollow(
              userId,
              req.body.followedUserID,
              sessionHash,
              nextSessionHash
            );
        } else {
          token.reason =
            "set follow parameter to 1 or 0 to flag follow or unfollow";
          res.json(token);
          return;
        }
        //////
        token.success = true;
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/group/flagFollowUnfollow", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  var token = { success: false, signinTime: req.body.signinTime };
  const exists = await groupContract.checkGroupExist(req.body.followedGroup);
  if (!exists) {
    console.log("eq.body.followedGroup", req.body.followedGroup);
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
        if (req.body.followedGroup === undefined) {
          token.reason = "undefined follower/followedGroup";
          res.json(token);
          return;
        }
        if (req.body.follow === 1) {
          await groupContract
            .connect(serverWallet)
            .follow(
              req.body.userAddress,
              req.body.followedGroup,
              sessionHash,
              nextSessionHash
            );
        } else if (req.body.follow === 0) {
          await groupContract
            .connect(serverWallet)
            .unFollow(
              req.body.userAddress,
              req.body.followedGroup,
              sessionHash,
              nextSessionHash
            );
        }
        //////
        token.success = true;
      } else {
        token.reason = "non verified or expired token";
      }
      res.json(token);
    }
  } catch (err) {
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/group/update", async (req, res) => {
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
  }
});

app.post("/group/create", async (req, res) => {
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
            req.body.description,
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
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

app.post("/user/update", async (req, res) => {
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
        if (req.body.profilePicCid) {
          updates.data.push(req.body.profilePicCid);
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
    res.json(
      err.message.substring(
        err.message.indexOf("error={"),
        err.message.indexOf("code")
      )
    );
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
              if (req.body.profilePicCid) {
                updates.data.push(req.body.profilePicCid);
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
          res.json(
            error.message.substring(
              error.message.indexOf("error={"),
              error.message.indexOf("code")
            )
          );
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
      console.log("status check");
      const userStatus = await userContract.getStatus(req.body.userAddress);
      if (userStatus === false) {
        console.log("user with false status");
        token.reason = "invalid user";
        res.json(token);
        return;
      }

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
    } catch (err) {
      res.json(
        err.message.substring(
          err.message.indexOf("error={"),
          err.message.indexOf("code")
        )
      );
    }
  }
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
