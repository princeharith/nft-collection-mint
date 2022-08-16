import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";



export default function Home() {
    //this keeps track of whether user's wallet connected or not
    const [walletConnected, setWalletConnected] = useState(false);

    //presaleStarted keeps track of whether it has started or not
    const [presaleStarted, setPresaleStarted] = useState(false);

    const [presaleEnded, setPresaleEnded] = useState(false);

    const [loading, setLoading] = useState(false);

    const [isOwner, setIsOwner] = useState(false);

    const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

    const web3ModalRef = useRef();


    //mint an NFT during presale
    const presaleMint = async() => {
        try {
            //write txn, so we need a signer
            const signer = await getProviderOrSigner(true)
            
            //creating a new instance with signer
            const whitelistContract = new Contract (
                NFT_CONTRACT_ADDRESS,
                abi, 
                signer
            );

            //calling the presaleMint from the contract
            const tx = await whitelistContract.presaleMint({
                value: utils.parseEther("0.01"),
            });
            setLoading(true);

            //wait for txn
            await tx.wait();
            setLoading(false);
            window.alert("You successfully minted a Crypto Dev!");
        } catch (err) {
            console.error(err);
        }
    };

    const publicMint = async() => {
        try {
            const signer = await getProviderOrSigner(true);

            const whitelistContract = new Contract (
                NFT_CONTRACT_ADDRESS,
                abi,
                signer
            );
            
            //getting the ether balance of the account
            const accountBalance = await signer.getBalance();

            const formattedAccountBalance = utils.formatEther(accountBalance.toString());
            
            if (formattedAccountBalance < .01){
                window.alert("This account's ether balance is too low. Please go to the following faucet: https://faucet.polygon.technology/ and add ether.");
            }

            console.log(utils.formatEther(accountBalance.toString()));

            const tx = await whitelistContract.mint({
                value: utils.parseEther("0.01")
            });
            setLoading(true);

            await tx.wait();
            setLoading(false);

            const currTokenId =  await getTokenIDsMinted();
            
            window.alert("You've succesfully minted a Crypto Dev! Check it out at https://testnets.opensea.io/assets/mumbai/0xf3a56c9fc62f37e943b7bb41343c02659d2ca941/"+currTokenId);
        } catch (err) {
            console.log(err);
        }
    };

    const connectWallet = async() => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch(err) {
            console.log(err);
        }
    };

    const startPresale = async() => {
        try {
            const signer = await getProviderOrSigner(true);

            const whitelistContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                abi,
                signer
            );

            const tx = await whitelistContract.startPresale();
            setLoading(true);
            await tx.wait();
            setLoading(false);

            await checkIfPresaleStarted();
        } catch(err) {
            console.log(err);
        }
    };

    //checkIfPresaleStarted checks if presale started by querying
    //'presaleStarted' variable
    const checkIfPresaleStarted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner();
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the Contract
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
            // call the presaleStarted from the contract
            const _presaleStarted = await nftContract.presaleStarted();

            

            if (!_presaleStarted) {
                await getOwner();
                console.log(isOwner);
            }
            setPresaleStarted(_presaleStarted);
            
            
            return _presaleStarted;
        } catch (err) {
            console.error(err);
            return false;
        }
        };
        


    const checkIfPresaleEnded = async() => {
        try {
            const provider = await getProviderOrSigner();

            const nftContract = new Contract (
                NFT_CONTRACT_ADDRESS,
                abi,
                provider
            );

            const _presaleEnded = await nftContract.presaleEnded();

            //using 'lt' (less than) since _preSaleEnded is a BigNumber
            //Date.now()/1000 returns current time in secs
            //if presaleEnded timestamp is less than current time, it has ended
            const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
            if (hasEnded) {
                setPresaleEnded(true);
            } else {
                setPresaleEnded(false);
            }
            return hasEnded;
        } catch(err){
            console.log(err);
            return false;
        }
    };

    const getOwner = async() => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract (
                NFT_CONTRACT_ADDRESS,
                abi,
                provider
            );
            const _owner = await nftContract.owner();
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();

            if (address.toLowerCase() == _owner.toLowerCase()){
                setIsOwner(true);
            }

            
        } catch (err){
            console.log(err);
        }
    };

    const getTokenIDsMinted = async() => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract (
                NFT_CONTRACT_ADDRESS,
                abi,
                provider
            );
            const _tokenIds = await nftContract.tokenIds();

            //convert the 'Big Number' to a string
            setTokenIdsMinted(_tokenIds.toString());
            console.log(_tokenIds.toString());

            return _tokenIds.toString();
        } catch(err) {
            console.log("cant find provider")
            console.log(err);
        }
    };

    const getProviderOrSigner = async (needSigner = false) => {
        // Connect to Metamask
        // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);
    
        // If user is not connected to the Rinkeby network, let them know and throw an error
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 80001) {
            window.alert("Change the network to Polygon");
            throw new Error("Change network to Polygon");
        }
    
        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
        };



    //effect change for when value of wallet connected changes

    

    useEffect(() => {
        console.log("Initial" + presaleStarted);
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "mumbai",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();

            // //check presale
            // const _presaleStarted = checkIfPresaleStarted();
            // if (_presaleStarted) {
            //     checkIfPresaleEnded();
            // }

            // getTokenIDsMinted();


            // //interval every 5 secs that checks if presale ended
            // const presaleEndedInterval = setInterval(async function() {
            //     const _presaleStarted = await checkIfPresaleStarted();
            //     if (_presaleStarted) {
            //         const _presaleEnded = await checkIfPresaleEnded();
            //         if (_presaleEnded) {
            //             clearInterval(presaleEndedInterval);
            //         }
            //         }
            //     }, 5 * 1000);

            // setInterval(async function() {
            //     await getTokenIDsMinted();
            // }, 5*1000);
        }
    }, [walletConnected]);

    


    const renderButton = () => {
        //console.log("has preSale Started? " + presaleStarted);
        //console.log("has presale Ended? " + presaleEnded);
        if (!walletConnected) {
            return (
                <button onClick={connectWallet} className={styles.button}>
                    Connect your wallet!
                </button>
            );
        }
    
        // if (loading) {
        //     return <button className={styles.button}>Loading...</button>;
        // }

        // if (isOwner && !presaleStarted) {
        //     return (
        //         <button className={styles.button} onClick={startPresale}>
        //             Start Presale!
        //         </button>
        //     );
        // }

        // if (!presaleStarted) {
        //     return (
        //         <div>
        //             <div className={styles.description}>Presale hasn't started</div>
        //         </div>
        //     );
        // }

        // if (presaleStarted && !presaleEnded) {
        //     return (
        //         <div>
        //         <div className={styles.description}>
        //             Presale has started!!! If your address is whitelisted, Mint a
        //             Crypto Dev
        //         </div>
        //         <button className={styles.button} onClick={presaleMint}>
        //             Presale Mint
        //         </button>
        //         </div>
        //     );
        //     }

        // if (presaleStarted && presaleEnded){
        else{
            return (
                <button className={styles.button} onClick={publicMint}>
                    Mint
                </button>
            );
        }
    };


    return (
        <div>
            <Head>
                <title>PT NFT Minter</title>
                <meta name="description" content="Whitelist-Dapp" />
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>PlayerTrader NFT Minter</h1>
                    {/* <div className={styles.description}>
                        An NFT collection for my fellow Crypto Developers
                    </div> */}
                    { <div className={styles.description}>
                        {tokenIdsMinted}/20 PT NFTs have been minted so far
                    </div>}
                    <div className={styles.container}>
                    {renderButton()}
                    </div>
                </div>
            </div>
            <img className={styles.image} src="./Social2.png" />
        </div>
    );

}
