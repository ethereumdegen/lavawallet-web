

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
    from,to,walletAddress,tokenAddress,tokenAmount,
    relayerReward,expires,nonce,signature)
  {

    return {
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



    static formatAmountWithDecimals(amountRaw,decimals)
    {
    var amountFormatted = amountRaw / (Math.pow(10,decimals) * 1.0)

  //  amountFormatted = Math.round(amountFormatted,decimals)

    return amountFormatted;
  }

}
