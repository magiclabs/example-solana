import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";
import * as web3 from "@solana/web3.js";

const rpcUrl = 'https://api.devnet.solana.com';

const magic = new Magic("pk_live_8350FF5E797D679F", {
  extensions: {
    solana: new SolanaExtension({
      rpcUrl
    })
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata()
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithEmailOTP({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handleSignTransaction = async () => {
    setSendingTransaction(true);
    const metadata = await magic.user.getMetadata();
    const recipientPubKey = new web3.PublicKey(destinationAddress);
    const payer = new web3.PublicKey(metadata.publicAddress);
    const connection = new web3.Connection(rpcUrl);

    const hash = await connection.getRecentBlockhash();


    let transactionMagic = new web3.Transaction({
      feePayer: payer,
      recentBlockhash: hash.blockhash
    });

    const transaction = web3.SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipientPubKey,
      lamports: sendAmount,
    });

    transactionMagic.add(...([transaction]));

    const serializeConfig = {
      requireAllSignatures: false,
      verifySignatures: true
    };

    const signedTransaction = await magic.solana.signTransaction(transactionMagic, serializeConfig);
    setSendingTransaction(false);

    setTxHash('Check your Signed Transaction in console!');

    console.log("Signed transaction", signedTransaction);
  }

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Solana address</h1>
            <div className="info">{publicAddress}</div>
          </div>
          <div className="container">
            <h1>Sign Transaction</h1>
            {txHash ? (
              <div>
                <div>Sign transaction success</div>
                <div className="info">{txHash}</div>
              </div>
            ) : sendingTransaction ? (
              <div className="sending-status">Sending transaction</div>
            ) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={(event) => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in LAMPORTS"
              onChange={(event) => {
                setSendAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handleSignTransaction}>
              Sign Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
