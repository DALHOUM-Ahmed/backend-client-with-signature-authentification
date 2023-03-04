require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs").promises;

const s3 = new AWS.S3({
  accessKeyId: "5DD0DF9473A8601DA825",
  secretAccessKey: "1UwruvMP0k5Wqz3Xtb6wBHBxB6X6Tx6vRFYawQcj",
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  signatureVersion: "v4",
});

console.log("found");

async function main() {
  let data = await fs.readFile("fileToUpload");

  const params = {
    Bucket: "deme-test-buckett",
    Key: "abcd",
    Body: data,
    // Metadata: { import: "car" },
  };
  // let cid;
  const request = s3.putObject(params);
  request.on("httpHeaders", (statusCode, headers) => {
    // console.log("headers", headers);
    // console.log("statusCode", statusCode);
    console.log(`CID: ${headers["x-amz-meta-cid"]}`);
    // cid = headers["x-amz-meta-cid"];
  });
  // request.promise().then((e) => console.log("request.send()", cid));
  console.log(
    "log",
    (await request.promise()).$response.httpResponse.headers["x-amz-meta-cid"]
  );
}

main();
