const fetch = require("node-fetch");
const fs = require("fs");

function base64_encode(file) {
  var bitmap = fs.readFileSync(file);
  return Buffer.from(bitmap).toString("base64");
}

//tcs  & infosis
const data = {
  image: base64_encode("flowers-276014__340.jpg"),
  userAddress: "0x42c48536c1777663ec4047c0134b261eb7eddfde",
  signature:
    "0x99849a352fb8a6b5b6842d65a1b9bc359ee16aea1b9631b66d666ef3da3017411365c88b83eff360ffda2c87a4fcf1d5a0ab5c2a725522c2fecc136dc9f60ebf1c",
  timestamp: 1673514376,
};
const payload = JSON.stringify(data);
// console.log("payload", payload)
// fs.writeFile("./base64.json", payload, function (err) {
//   if (err) throw err;
//   console.log("Results Received");
// });

fetch("https://ezyjhd4pjksojfzgb44vmf7bhu0zmjvh.lambda-url.us-east-1.on.aws/", {
  method: "POST",
  body: payload,
  headers: { "Content-Type": "application/json" },
}).then((json, err) => {
  if (err) {
    console.log("error", err);
  } else {
    if (json.body._readableState.buffer.head)
      console.log(
        Buffer.from(json.body._readableState.buffer.head.data).toString()
      );
  }
});

// fs.writeFile(
//   "./result.json",
//   JSON.stringify(json.body._readableState.buffer.head.data),
//   function (err) {
//     if (err) throw err;
//     console.log("Results Received");
//   }
// );
