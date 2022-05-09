import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import Image from "next/image";
import OdigboNFT from "../public/OdigboNFT/0.jpg"
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected keeps whether the user's wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);

  // presaleStarted keeps track whether presale started
  const [presaleStarted, setPresaleStarted] = useState(false);

  // presaleEnded keeps track whether presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);

  // loading is set to true when waiting for a transaction to get minted
  const [loading, setLoading] = useState(false);

  // checks if the currently connected Metamask wallet is the owner of contract
  const [isOwner, setIsOwner] = useState(false);

  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

  // reference to web3modal for connecting to metamsk which persisits as page is open
  const web3ModalRef = useRef();


  /**
   * presaleMint : Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      // Need signer since it is a 'write' transation
      const signer = await getProviderOrSigner(true);

      // Create a new instance of the contract with a signer, which allows update methods
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const tx = await whitelistContract.presaleMint({
        // value signifies the cost of one OdigboNFT which is "0.01" eth
        // We are parsing '0.01' string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01",)
      });
      setLoading(true);

      // wait for transaction to get minted 
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted an OdigboNFT!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted an OdigboNFT!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * connectWallet: Connects the metamask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which here is Metamask
      // When used for the first time, prompts user to connect wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * startPresale: starts the presale for the NFT Collection
   */
  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );

      // call the startPresale from the contract
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfPresaleStarted: checks if the presale has started by quering the 'presaleStarted' variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      // No need for signer as we're only reading from blockchain
      const provider = await getProviderOrSigner();

      // Connect to the contract using only provider so we have read-only access to the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfpresaleEnded: checks if presale has ended by quering the 'presaleEnded' variable in the contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // call presaleEnded from contract
      const _presaleEnded = await nftContract.presaleEnded();

      //_presaleEnded is a Big Number, so we are using the lt(less than function) instead of <
      // Date.now()/1000 returns time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds is a Big Number so we convert to string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };


  const getProviderOrSigner = async (needSigner = false) => {

    // connect to Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // Throw error if user is not connected to Rinkeby
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedprovider: false,
      });
      connectWallet();

      // check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // Interval to get token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);



  const renderButton = () => {
    // if wallet is not connected, returns button that allows user to connect wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>Connect your wallet
        </button>
      );
    }


    // returns loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>Start Presale!</button>
      );
    }

    // if connected user is not owner say presale hasn't started
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.button}>Presale hasnt started!</div>
        </div>
      );
    }

    // if presale started and hasn't ended allow for minting during presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint an OdigboNFT
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>
          OdigboNFT
        </title>

        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to OdigboNFT!</h1>
          <div className={styles.description}>
            Its an NFT collection for friends of Odigbo.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <Image className={styles.image} src={OdigboNFT} alt="Picture of NFT" width={400} height={300} />
        </div>
      </div>

      <footer className={styles.button}>
        Made with &#10084; by Faithful Odigbo
      </footer>
    </div>
  );
}
