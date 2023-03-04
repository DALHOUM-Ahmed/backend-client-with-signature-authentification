const axios = require("axios");

async function getUserByAddress(userAddress) {
  const result = await axios({
    url: "https://api.thegraph.com/subgraphs/name/dalhoum-ahmed/deme-test-graph",
    method: "post",
    data: {
      query: `
      {
          users(where: {userAddress: "${userAddress.toLowerCase()}"}, orderBy: id, orderDirection: desc) {
            userName
            id
          }
        }
        `,
    },
  });
  console.log(result.data.data.users);
  return result.data.data.users;
}

getUserByAddress("0xf9013432B10E1F446bb19D5b7C15baB43E9C3867");
