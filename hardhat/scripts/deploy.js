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

    const crpyotDevsContract = await ethers.getContractFactory("CryptoDevs");

    //deploy the contract
    const deployedCryptoDevsContract = await crpyotDevsContract.deploy(
        metadataURL,
        whitelistContract
    );

    console.log(
        "contract deployed to",
        deployedCryptoDevsContract.address
    );
}


    main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

