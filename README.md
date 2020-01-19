
 ## Lava Protocol Wallet


 This dapp lets you transfer tokens with Meta Transactions

 https://lavaprotocol.com/

 https://etherscan.io/address/0x5c5ca8c79bf69a5449f1f621215e9cfc91189cc5#code

 This application uses EIP712 and PersonalSign in order to allow you to sign an 'offchain packet of data' which contains data describing a transaction that you want to be performed, like transferring ERC20 tokens. You can attach a fee in terms of those ERC20 tokens.


 Anyone can pay gas to submit to signed 'datagram' to the Ethereum network and to the Lava smart contract. When the tx is mined, the contract checks the signature and if it is good, the submitter will be rewarded with the fee in tokens and the transaction that you specified will be performed.


 This new update for the contract makes it totally NON-ESCROW and compatible with ANY ERC20 TOKEN. This means that MetaTX can be performed on any standard ERC20 tokens without any modifications or hassle or re-escrowing. This is part of the Metamask Meta TX competition going on.
 
 ## Arbitrary Code Execution
 
  In order to use Lava Packets to execute arbitray code, all you have to do is set the 'method' string field to some data (or leave it blank -- anything but the word 'transfer') and then in the packet data set the 'To' field (recipient) to a smart contract's address.  That smart contract's RecieveApproveAndCall() method will be executed when the relayer submits the lava packet to the eth network, using the tokens in the lava packet!  




     struct LavaPacket {
       string methodName;
       address relayAuthority; //either a contract or an account
       address from;
       address to;
       address wallet;  //this contract address
       address token;
       uint256 tokens;
       uint256 relayerRewardTokens;
       uint256 expires;
       uint256 nonce;
     }








## how to run
1. install node8
2. install dependencies with 'npm install'
3. run tests with 'npm run test'




Will use EIP 712
https://medium.com/metamask/scaling-web3-with-signtypeddata-91d6efc8b290

https://github.com/ukstv/sign-typed-data-test/blob/master/contracts/SignTypedData.sol#L11

https://github.com/danfinlay/js-eth-personal-sign-examples


https://programtheblockchain.com/posts/2018/02/17/signing-and-verifying-messages-in-ethereum/



### Published on Ropsten  

ECRecover
0x57b8bf55a05dd481b4f8c5fda9dbaa937799db69

LavaWallet
0x38d5665ec478e0340b46a062071a2694bbc0b451


## smart contract todo
-Add a token withdrawl mechanism  


## HOW TO TEST
npm run dev
