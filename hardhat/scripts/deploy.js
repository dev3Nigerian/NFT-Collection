const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants")

async function main() {
  // Address of whitelist contract deployed
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

  // URL from where to extract metadata for OdigboNFT
  const metadataURL = METADATA_URL;

  // OdigboNFTContract here is a factory for insstances of OdigboNFT contract 
  const OdigboFaithfulNFTContract = await ethers.getContractFactory("OdigboFaithfulNFT");

  // deploy the contract
  const deployedOdigboFaithfulNFTContract = await OdigboFaithfulNFTContract.deploy(
    metadataURL,
    whitelistContract
  );

  console.log(
    "OdigboFaithfulNFT Contract Address:", deployedOdigboFaithfulNFTContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });