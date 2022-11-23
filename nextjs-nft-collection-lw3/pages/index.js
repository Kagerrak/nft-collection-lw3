import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import { Contract, providers, utils } from "ethers";
import web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.005"),
      });
      await tx.wait(1);
      window.alert("You succesfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      await tx.wait(1);
      window.alert("You succesfully minted a CryptoDev!");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      // Get an instance of you NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      // Get an instance of you NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000; // have to divide by 1000 to convert miliseconds to seconds
      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.error(error);
    }
  };

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );
      const tx = await nftContract.startPresale();
      await tx.wait(1);
      setPresaleStarted(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      // Get an instance of you NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // We need to gain access to the provider/signer from Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If the user is NOT connected to Goerli, tell them to switch to Goerli
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to Goerli Network");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    // Track in real time number of minted NFTs
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000);

    // Track in real time status of presale(started,ended,whatever)
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();

      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, []);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect you wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.loader}></span>;
    }

    if (isOwner && !presaleStarted) {
      // render a . button to start the presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      // just say that presale hasnt started yet, come back later
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later!
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint presale
      // they need to be in the whitelist for this to work
      return (
        <div>
          <span className={styles.description}>
            Presale has started! If your addrress is whitelisted, you can mint a
            CryptoDev!
          </span>
          <button onClick={presaleMint} className={styles.button}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      // allow user to take part in public sale;
      return (
        <div>
          <span className={styles.description}>
            Presale has ended. You can mint a CryptoDev in public sale, if any
            remain.
          </span>
          <button onClick={publicMint} className={styles.button}>
            Public Mint 🚀
          </button>
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.descriptio}>
            CryptoDevs NFT is a collection for developers in web3
          </div>
          <div className={styles.description}>
            {numTokensMinted === 0 ? 0 : numTokensMinted}/20 have been minted
            already!
          </div>
          <div className={styles.container}>{renderBody()}</div>
          <img className={styles.image} src="/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>Made with ❤️ by Crypto Devs</footer>
    </div>
  );
}