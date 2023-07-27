async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const token = await ethers.deployContract("Token");
  console.log("DENEMEEEEEEEE");
  console.log(token);

  console.log(`Token deployed at ` + (await token.getAddress()));
  console.log("1111111111111111");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
