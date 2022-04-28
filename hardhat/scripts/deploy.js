const {ethers} = require("hardhat");
require("dotenv").config({ path: ".env" });
const {WHITELIST_CONTRACT_ADDRESS, METADATA_URL} = require("../constants");

async function main() {
    //address of whitelist contract
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

    //URL for NFT metadata
    const metadataURL = METADATA_URL;

    //contract factory is an abstraction to deploy new smart contracts
    //this is a factory instance of our CryptoDev NFT

    const nftContract = await ethers.getContractFactory("PlayerTraderNFT");

    //deploy the contract
    const deployedNftContract = await nftContract.deploy(
        metadataURL,
        whitelistContract
    );

    console.log(
        "contract deployed to",
        deployedNftContract.address
    );
}


    main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

