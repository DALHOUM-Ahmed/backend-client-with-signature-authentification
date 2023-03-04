async function getAddressID(address) {
  console.log(address.toLowerCase());
  const data = JSON.stringify({
    query: `query { getUserByAddress(text: "${address}") { 
        id 
        userName 
        userAddress
        tags
         } 
    }`
  });

  const response = await fetch(
    "https://api.thegraph.com/subgraphs/name/dalhoum-ahmed/aurora-test-user-post-5",
    {
      method: "post",
      body: data,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        "User-Agent": "Node"
      }
    }
  );

  const json = await response.json();
  console.log(json.data);
}
getAddressID("0xf9013432B10E1F446bb19D5b7C15baB43E9C3867");
