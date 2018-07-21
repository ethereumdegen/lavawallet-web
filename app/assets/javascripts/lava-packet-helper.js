

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

  static serializePacketData (obj, prefix) {
    var str = [],
      p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }


  static async sendLavaPacket(lavaNodeURL, lavaPacketData)
  {


      if(!lavaNodeURL.startsWith("http://"))
      {
        lavaNodeURL = "http://"+lavaNodeURL;
      }

      if(!lavaNodeURL.endsWith("/lavapacket"))
      {
        lavaNodeURL = lavaNodeURL+"/lavapacket";
      }

      return new Promise(async resolve => {

        var xhr = new XMLHttpRequest();

        xhr.open('POST', lavaNodeURL);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');


        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            //var response = JSON.parse(xhr.responseText);
              if (xhr.status === 200  ) {
                 console.log('successful');
                 resolve({success:true, packet: lavaPacketData})
              } else {
                 console.log('failed');
                 resolve({success:false, message: 'Request failed.  Returned status of ' + xhr.status});

              }
          }
        }

        xhr.send(LavaPacketHelper.serializePacketData( lavaPacketData ));

      })


  }




}
