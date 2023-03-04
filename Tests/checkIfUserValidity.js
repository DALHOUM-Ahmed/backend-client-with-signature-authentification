require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const keccak256 = require("keccak256");
const cors = require("cors");
const bodyParser = require("body-parser");
const ethUtil = require("ethereumjs-util");
const userAbi = require("../ABIs/user.json");
const groupAbi = require("../ABIs/group.json");
const postAbi = require("../ABIs/post.json");
const reportAbi = require("../ABIs/report.json");
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

const userContractAddress = "0x41B66678143FAce0E8b48A6b07E9F2Fdf45A497B"; //"0x268362600dC0f43e04870eE3fD994DDc5Ba699d0";
const groupContractAddress = "0xC716391A331441Dc41a111520FD0d64Cb060fE45";
const postContractAddress = "0xb3313Eb93e882315EC50fE95df0D96A0a887cD1F";
const reportContractAddress = "0xF82B30721ECE3C38326D6EfA0139EcB06B0deed0";

const ethThresholdToPostInEthGroup = 0.1;
const bnbThresholdToPostInBscGroup = 0.1;

const provider = new ethers.providers.JsonRpcProvider(
  "https://cmp-testnet.rpc.thirdweb.com"
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

async function getUserStatus(userAddress) {
  //   const result = await axios({
  //     url: "http://54.177.105.212:8000/subgraphs/name/deme/testnet-subgraph",
  //     method: "post",
  //     data: {
  //       query: `
  //         {
  //             users(where: {userAddress: "${userAddress.toLowerCase()}"}, subgraphError: allow) {
  //               status
  //             }
  //           }
  //           `,
  //     },
  //   });
  const userStatus = await userContract.getStatus(userAddress);
  console.log("userStatus", userStatus);
  //   return result.data.data.users[0].status;
}

getUserStatus("0xf9013432B10E1F446bb19D5b7C15baB43E9C3867");
