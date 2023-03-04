const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: "5DD0DF9473A8601DA825",
  secretAccessKey: "1UwruvMP0k5Wqz3Xtb6wBHBxB6X6Tx6vRFYawQcj",
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  signatureVersion: "v4",
});

async function uploadNftPost() {
  const postNftMetadata = { body: "post body", title: "post title" };

  const params = {
    Bucket: "deme-test-users",
    Key: "testFolderCreatedProgramatically/testObject.json",
    Body: JSON.stringify(postNftMetadata),
    // Metadata: { import: "car" },
  };
  const request = s3.putObject(params);
  let cid = (await request.promise()).$response.httpResponse.headers[
    "x-amz-meta-cid"
  ];

  console.log(cid);
}

uploadNftPost();
