
 ## Lava Protocol Wallet


 This dapp lets you transfer tokens with Meta Transactions

 https://lavaprotocol.com/

 https://etherscan.io/address/0x5c5ca8c79bf69a5449f1f621215e9cfc91189cc5#code

![image](https://user-images.githubusercontent.com/6249263/72673879-ed7c8c00-3a3d-11ea-8aa0-df98f0cff530.png)


 This application uses EIP712 and PersonalSign in order to allow you to sign an 'offchain packet of data' which contains data describing a transaction that you want to be performed, like transferring ERC20 tokens. You can attach a fee in terms of those ERC20 tokens.


 Anyone can pay gas to submit the signed 'datagram' to the Ethereum network and to the Lava smart contract. When the tx is mined, the contract checks the signature and if it is good, the submitter will be rewarded with the fee in tokens and the transaction that you specified will be performed.


 This new update for the contract makes it totally NON-ESCROW and compatible with ANY ERC20 TOKEN. This means that MetaTX can be performed on any standard ERC20 tokens without any modifications or hassle or re-escrowing. 

 ## Arbitrary Code Execution

  In order to use Lava Packets to execute arbitrary code, all you have to do is set the 'methodName' string field of the packet to the data for the call (or leave it blank -- anything but the word 'transfer') and then in the packet data set the 'To' field (recipient) to a smart contract's address.  That smart contract's RecieveApproveAndCall(from,token,tokens,mdata) method will be executed when the relayer submits the lava packet to the eth network, using the tokens in the lava packet!  




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




## Relay Authorities
Typically, you will use address 0x0 as the relay authority to allow msg.sender to relay that packet.  However you can also set that to a specific non-contract address so then only that address will be able to submit the packet.  YOu can also set that to a contract address and that contract's 'RelayAuthorityInterface' method will be queried to get the 'master relayer' address for that particular moment in time.

This means that a relay authority contract X can be built which, for example, cycles through many ethereum addresses of different relays over time.  At any given time, only the address being returned by that method of the contract can relay that packet!   This means you can even build a PoS or PoA relay authority.  Or even a PoW one!?   Whatever you could possibly imagine.  It is abstracted out on a per-packet basis.





## How to Run
1. install node8
2. install dependencies with 'npm install'
3.  npm run dev



  You can run the tests for the truffle contract at https://github.com/admazzola/lava-wallet






## HOW TO TEST
npm run dev 
