

var lavaWalletABI = require('../contracts/LavaWallet.json')
var _0xBitcoinABI = require('../contracts/_0xBitcoinToken.json')
var erc20TokenABI = require('../contracts/ERC20Interface.json')

var tokenData = require('../config/token-data.json')
var defaultTokens = require('../config/default-tokens.json')

var defaultTokenData;

var deployedContractInfo = require('../contracts/DeployedContractInfo.json')
var lavaWalletContract;
var _0xBitcoinContract;


export default class LavaPacketHelper {


  static getLavaPacket(
    method,from,to,walletAddress,tokenAddress,tokenAmount,
    relayerReward,expires,nonce,signature)
  {

    return {
      method:method,
      from: from,
      to: to,
      walletAddress:walletAddress,
      tokenAddress:tokenAddress,
      tokenAmount:tokenAmount,
      relayerReward:relayerReward,
      expires:expires,
      nonce:nonce,
      signature:signature
    }


  }


   static getLavaPacketSchemaHash()
   {
      var hardcodedSchemaHash = '0x8fd4f9177556bbc74d0710c8bdda543afd18cc84d92d64b5620d5f1881dceb37' ;
      return hardcodedSchemaHash;
   }

   static getLavaParamsFromData(method,from,to,walletAddress,tokenAddress,tokenAmount,relayerReward,expires,nonce)
   {
       var params = [

        {
          type: 'bytes',
          name: 'method',
          value: method
        },
         {
           type: 'address',
           name: 'from',
           value: from
         },
         {
           type: 'address',
           name: 'to',
           value: to
         },
         {
           type: 'address',
           name: 'walletAddress',
           value: walletAddress
         },
         {
           type: 'address',
           name: 'tokenAddress',
           value: tokenAddress
         },
         {
           type: 'uint256',
           name: 'tokenAmount',
           value: tokenAmount
         },
         {
           type: 'uint256',
           name: 'relayerReward',
           value: relayerReward
         },
         {
           type: 'uint256',
           name: 'expires',
           value: expires
         },
         {
           type: 'uint256',
           name: 'nonce',
           value: nonce
         },
       ]

       return params;
   }





    static formatAmountWithDecimals(amountRaw,decimals)
    {
    var amountFormatted = amountRaw / (Math.pow(10,decimals) * 1.0)

  //  amountFormatted = Math.round(amountFormatted,decimals)

    return amountFormatted;
  }

}
