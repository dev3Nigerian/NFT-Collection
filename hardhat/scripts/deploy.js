const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants")

async function main() {
  // Address of whitelist contract deployed
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

  // URL from where to extract metadata for OdigboNFT
  const metadataURL = METADATA_URL;

  // OdigboNFTContract here is a factory for insstances of OdigboNFT contract 
  const OdigboNFTContract = await ethers.getContractFactory("OdigboNFT");

  // deploy the contract
  const deployedOdigboNFTContract = await OdigboNFTContract.deploy(
    metadataURL,
    whitelistContract
  );

  console.log(
    "OdigboNFT Contract Address:", deployedOdigboNFTContract.address
  );

  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}