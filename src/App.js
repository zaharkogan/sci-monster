import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import './App.css';
import wavePortal from './utils/WavePortal.json';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [count, setCount] = useState();
  const messageRef = useRef();
  const [button, setButton] = useState('Help 🦄');
  /**
   * Create a varaible here that holds the contract address after you deploy!
   */
  const contractAddress = "0xa549a0e53025216c1A5f030A9851f838cf9f04AD";
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);
  const contractABI = wavePortal.abi;

  const checkNetwork = async () => {
    const { ethereum } = window;

    let chain = await ethereum.request({ method: 'eth_chainId' });
    console.log("Current chain is: " + chain);
    return chain;
  }

  /*
   * Create a method that gets all waves from your contract
   */
 const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        
      }
      checkNetwork();

        console.log("setting the network to ", parseInt(ethereum.networkVersion));

  // detect Network account change
  ethereum.on('chainChanged', function(chainId){
      let network = parseInt(chainId);
      if (network !== 4){
      setButton('Please connect to Rinkeby!');
      }
      else {
        setButton('Help 🦄');
      }
      console.log("Chain was updated", parseInt(chainId));
      console.log("setting the network to this ", parseInt(chainId));
  });

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {

    if (messageRef.current.value === '') {
      console.log('Message is empty');
      alert('The monster won\'t accept that!')
      return;
    }
    else
    {
      if(new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?").test(messageRef.current.value)) {
    }
    else
    {
      alert('The monster won\'t accept non-URLs!')
      return;
    }   
    }



    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        getAllWaves();
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setCount(count.toNumber());

        const waveTxn = await wavePortalContract.wave(messageRef.current.value);
        setButton("Devouring...");
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setButton("Help 🦄");
        count = await wavePortalContract.getTotalWaves();
        getAllWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setCount(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          🍗 Help us feed the science monster!
        </div>

        <div className="bio">
          A monster had attacked us, demanding scientific papers to devour! Please send any scientific papers to him for a chance of survival and treasures ✨
          <br/><br/>
          Papers' count: {count}
        </div>

        <button className="waveButton" onClick={wave}>
          {button}
        </button>
        <br/>
        <input required placeholder="Put the paper's URL here ❤" ref={messageRef}>
        </input>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.slice(0).reverse().map((wave, index) => {
          let theurl = 'https://rinkeby.etherscan.io/address/' + wave.address;
          console.log(theurl);
          return (
            <div key={index} className="Container" style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div><b>Address:</b> <a href={theurl}>{wave.address}</a></div>
              <div><b>Time:</b> {wave.timestamp.toString()}</div>
              <div><b>Paper:</b> <a href={wave.message}>{wave.message}</a></div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App