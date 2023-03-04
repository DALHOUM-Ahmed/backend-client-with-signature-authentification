const axios = require("axios");

const userAddress = "0x42C48536C1777663Ec4047c0134B261Eb7eDdFde".toLowerCase();
async function main() {
  const result = await axios({
    url: "https://api.thegraph.com/subgraphs/name/dalhoum-ahmed/aurora-test-user-post-3",
    method: "post",
    data: {
      query: `
    {
        users(where: {userAddress: "${userAddress.toLowerCase()}"}, orderBy: id, orderDirection: desc) {
          userName
          id
          userAddress
          firstName
          lastName
        }
      }
      `,
    },
  });
  console.log(result.data.data.users);
  if (result.data.data.users.length === 0) {
    console.log("non existing user");
  }
}

main();
