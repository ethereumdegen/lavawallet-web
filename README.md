
 ## Lava Protocol Wallet


 This new dapp lets you transfer tokens with Meta Transactions

 https://lavaprotocol.com/

 https://etherscan.io/address/0x5c5ca8c79bf69a5449f1f621215e9cfc91189cc5#code

 This application uses EIP712 and PersonalSign in order to allow you to sign an 'offchain packet of data' which contains data describing a transaction that you want to be performed, like transferring ERC20 tokens. You can attach a fee in terms of those ERC20 tokens.


 Anyone can pay gas to submit to signed 'datagram' to the Ethereum network and to the Lava smart contract. When the tx is mined, the contract checks the signature and if it is good, the submitter will be rewarded with the fee in tokens and the transaction that you specified will be performed.


 This new update for the contract makes it totally NON-ESCROW and compatible with ANY ERC20 TOKEN. This means that MetaTX can be performed on any standard ERC20 tokens without any modifications or hassle or re-escrowing. This is part of the Metamask Meta TX competition going on.











## How to Run
1. install node8
2. install dependencies with 'npm install'
3.  npm run dev


# You can run the tests for the truffle contract at https://github.com/admazzola/lava-wallet
