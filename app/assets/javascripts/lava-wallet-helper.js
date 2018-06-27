
const $ = require('jquery');

var web3utils = require('web3-utils')
var sigUtil = require('eth-sig-util')

import Vue from 'vue'

import LavaPacketHelper from './lava-packet-helper'
import LavaPacketUtil from './lava-packet-util'
//const lavaPacketHelper = new LavaPacketHelper();

var lavaWalletABI = require('../contracts/LavaWallet.json')
var legacyLavaWalletABI = require('../contracts/LavaWalletLegacy.json')
var lavaContractABI;

var _0xBitcoinABI = require('../contracts/_0xBitcoinToken.json')
var erc20TokenABI = require('../contracts/ERC20Interface.json')

var tokenData = require('../config/token-data.json')
var defaultTokens = require('../config/default-tokens.json')
var lavaSeedNodes = require('../config/lava-seed-nodes.json')


var defaultTokenData;

var deployedContractInfo = require('../contracts/DeployedContractInfo.json')
var lavaWalletContract;
var _0xBitcoinContract;

var balanceText;
var accountAddress;

var orderContainer;
var actionContainer;

var walletTokenList = [];

var order_cancels_list = [];
var my_orders_list = [];
var recent_trades_list = [];

//var primary_asset_address;
//var secondary_asset_address;
//var client_token_balances = {};
var clientTokenData = {};


export default class LavaWalletHelper {


  async init(alertRenderer, ethHelper)
  {
      this.alertRenderer=alertRenderer;
      this.ethHelper=ethHelper;




   this.web3 = this.detectInjectedWeb3();

   var self = this;



   if(this.web3 != null)
   {



      await new Promise(async resolve => {
        web3.version.getNetwork((err, netId) => {
          switch (netId) {
            case "1":
              self.networkVersion = 'mainnet';

              console.log('Web3 is using mainnet');


              break
            case "3":
              self.networkVersion = 'testnet';
              console.log('Web3 is using ropsten test network.');

              break
            default:
              console.log('This is an unknown network.')
          }

          resolve();
        })
      })

      if($('.legacy').length >= 1)
      {
        self.networkVersion = 'legacy';
      }

      lavaContractABI = lavaWalletABI;


      switch (self.networkVersion) {
        case 'mainnet':
          self.lavaWalletContract = deployedContractInfo.networks.mainnet.contracts.lavawallet;
          self._0xBitcoinContract = deployedContractInfo.networks.mainnet.contracts._0xbitcointoken;
          break
        case 'legacy':
          self.lavaWalletContract = deployedContractInfo.networks.legacy.contracts.lavawallet;
          self._0xBitcoinContract = deployedContractInfo.networks.legacy.contracts._0xbitcointoken;
          lavaContractABI = legacyLavaWalletABI;
          console.log('Using legacy lavawallet contract');
          break
        case 'testnet':
          self.lavaWalletContract = deployedContractInfo.networks.ropsten.contracts.lavawallet;
          self._0xBitcoinContract = deployedContractInfo.networks.ropsten.contracts._0xbitcointoken;
          break

        default:
          console.log('This is an unknown network version.')
      }

      console.log('lw',self.lavaWalletContract)






      // init defaultTokenData
         defaultTokenData = defaultTokens.tokens.map(symbol => tokenData.tokens.find(function(t) {
              return t.symbol == symbol;
              }) );






        console.log(defaultTokenData)

         defaultTokenData.map(t => t.icon_url = "/app/assets/img/token_icons/"+t.address+".png"   )

        if(self.networkVersion == 'testnet')
        {
          defaultTokenData.map(t => t.address = t.test_address   )
        }



            this.registerDropEvents()



        console.log(defaultTokenData)

        walletTokenList = defaultTokenData;


        var userAddress = web3.eth.accounts[0];
       //await this.updateWalletRender();

       try{
         await this.collectClientTokenBalances(walletTokenList,userAddress);
       }catch(e)
       {
         console.error(e)
       }


    }//web3 defined


      console.log('init vue')
      await this.initVueComponents();




      // await this.loadOrderEvents()






  }



  async initVueComponents(){

    var self = this;

    var app = new Vue({
       el: '#wallet-titlebar',
       data: {account: accountAddress,
                  balance: balanceText
              },


       methods: {
          update: function () {

          }
        }
     });


     var jumbotron = new Vue({
        el: '#jumbotron',
        data: {

                errorMessage: this.alertRenderer.alertMessage
             }

      });



    if(this.lavaWalletContract)
    {


      var defaultAction = 'deposit';

      if(this.networkVersion == 'legacy')
      {
        defaultAction = 'withdraw';
      }

      let DEFAULT_RELAY_NODE_URL = lavaSeedNodes.seedNodes[0].address;

        actionContainer = new Vue({
         el: '#action-container',
         data: {
                 selectedActionAsset: {name: 'nil'},
                 shouldRender: false,
                 supportsDelegateCallDeposit: false,
                 selectedActionType: defaultAction,
                 approveTokenQuantity: 0,
                 depositTokenQuantity: 0,
                 approveAndDepositTokenQuantity: 0,
                 withdrawTokenQuantity: 0,
                 transferTokenQuantity: 0,
                 transferTokenRecipient : 0,
                 transferTokenRelayReward: 0,
                 broadcastMessage: null,
                 relayNodeURL: DEFAULT_RELAY_NODE_URL,
                 lavaPacketData: null,
                 lavaPacketExists: false
              }

       });

      var footer = new Vue({
         el: '#footer',
         data: {
           address: this.lavaWalletContract.blockchain_address,
              }

       });

   }








     var assetList = new Vue({
       el: '#asset-list',
       data: {

         tokens: {token_list:walletTokenList}

            },

       methods: {
          update: function () {

          }
        }
     });



     Vue.nextTick(function () {
       self.registerAssetRowClickHandler()

     })




  }

  registerDropEvents()
  {
    var self = this ;


    $('.lava-packet-dropzone').on('dragover', function(e) {
         e.stopPropagation();
         e.preventDefault();
       //  e.dataTransfer.dropEffect = 'copy';
     });

    console.log('added listenr ')

    $('.dropzone-file-input').on('change', function(e) {
      e.stopPropagation();
      e.preventDefault();

      console.log('handle packet drop' )

      var files =   $(this).prop('files'); // Array of all files
      console.log(files)

      self.readDroppedFiles(files);
    });


     $('.lava-packet-dropzone').on('drop', function(e) {
       e.stopPropagation();
       e.preventDefault();

       console.log('handle packet drop' )

       var files = e.originalEvent.dataTransfer.files; // Array of all files
       console.log(files)
        self.readDroppedFiles(files);


      } )


  }


  async readDroppedFiles(files)
  {
    var self = this ;

    for (var i=0, file; file=files[i]; i++) {

        if (file.name.endsWith('.lava')) {

            var reader = new FileReader();
              // Closure to capture the file information.
              reader.onload = (function(theFile) {
                return function(e) {
                 var parsedFileJson = JSON.parse(e.target.result);

                 self.initiateLavaPackTransaction( JSON.parse( parsedFileJson) )

                };
              })(file);

            reader.readAsText(file); // start reading the file data.
        }
    }
  }

  async initiateLavaPackTransaction(lavaPacket)
  {
    console.log('initiate', lavaPacket);
    console.log('to', lavaPacket.to);



   var contract = this.ethHelper.getWeb3ContractInstance(
     this.web3,
     this.lavaWalletContract.blockchain_address,
     lavaContractABI.abi
   );

  if(lavaPacket.method == 'transfer')
  {

     contract.transferTokensFromWithSignature.sendTransaction(

        lavaPacket.from,
        lavaPacket.to,
        lavaPacket.tokenAddress,
        lavaPacket.tokenAmount,
        lavaPacket.relayerReward,
        lavaPacket.expires,
        lavaPacket.nonce,
        lavaPacket.signature,

        function(){
          console.log('done!')
        }

      );


    }else if(lavaPacket.method == 'withdraw')
    {

       contract.withdrawTokensFromWithSignature.sendTransaction(

          lavaPacket.from,
          lavaPacket.to,
          lavaPacket.tokenAddress,
          lavaPacket.tokenAmount,
          lavaPacket.relayerReward,
          lavaPacket.expires,
          lavaPacket.nonce,
          lavaPacket.signature,

          function(){
            console.log('done!')
          }

        );


      }else if(lavaPacket.method == 'approve')
      {

         contract.approveTokensWithSignature.sendTransaction(

            lavaPacket.from,
            lavaPacket.to,
            lavaPacket.tokenAddress,
            lavaPacket.tokenAmount,
            lavaPacket.relayerReward,
            lavaPacket.expires,
            lavaPacket.nonce,
            lavaPacket.signature,

            function(){
              console.log('done!')
            }

          );


        }else
        {

           contract.approveAndCall.sendTransaction(
              lavaPacket.method,
              lavaPacket.from,
              lavaPacket.to,
              lavaPacket.tokenAddress,
              lavaPacket.tokenAmount,
              lavaPacket.relayerReward,
              lavaPacket.expires,
              lavaPacket.nonce,
              lavaPacket.signature,

              function(){
                console.log('done!')
              }

            );


          }

    //else if approve , withdraw



  }

  async registerAssetRowClickHandler()
  {
    var self = this;


    $('.asset-row').off();
    $('.asset-row').on('click',async function(){
      var token_address = $(this).data('tokenaddress');
      console.log('token_address',token_address);

      self.selectActionAsset(token_address)

    });
  }



  async registerActionContainerClickHandler()
  {
    var self = this;


    $('.tab-action').off();
    $('.tab-action').on('click',  function(){

      var actionType = $(this).data('action-type');

      self.selectActiveAction(actionType);

    });




    $('.btn-action-approve').off();
    $('.btn-action-approve').on('click',  function(){

      var selectedActionAsset = actionContainer.selectedActionAsset ;

      var tokenAddress = selectedActionAsset.address;
      var approveAmount = actionContainer.approveTokenQuantity;
      var tokenDecimals = selectedActionAsset.decimals;


          console.log('approve ', tokenAddress,  approveAmount)
      self.approveToken(tokenAddress, approveAmount, tokenDecimals, function(error,response){
         console.log(response)
      });

    });


    $('.btn-action-approve-and-deposit').off();
    $('.btn-action-approve-and-deposit').on('click',  function(){

      var selectedActionAsset = actionContainer.selectedActionAsset ;

      var tokenAddress = selectedActionAsset.address;
      var depositAmount = actionContainer.approveAndDepositTokenQuantity;
      var tokenDecimals = selectedActionAsset.decimals;


          console.log('approve and deposit ', tokenAddress,  depositAmount)
          self.approveAndDepositToken(tokenAddress, depositAmount, tokenDecimals, function(error,response){
         console.log(response)
      });

    });

    $('.btn-action-deposit').off();
    $('.btn-action-deposit').on('click',  function(){

      var selectedActionAsset = actionContainer.selectedActionAsset ;

      var tokenAddress = selectedActionAsset.address;
      var depositAmount = actionContainer.depositTokenQuantity;
      var tokenDecimals = selectedActionAsset.decimals;


          console.log('deposit ', tokenAddress,  depositAmount)
          self.depositToken(tokenAddress, depositAmount, tokenDecimals, function(error,response){
         console.log(response)
      });

    });


    $('.btn-action-withdraw').off();
    $('.btn-action-withdraw').on('click',  function(){

      var selectedActionAsset = actionContainer.selectedActionAsset ;

      var tokenAddress = selectedActionAsset.address;
      var withdrawAmount = actionContainer.withdrawTokenQuantity;
      var tokenDecimals = selectedActionAsset.decimals;


          console.log('withdraw ', tokenAddress,  withdrawAmount)
          self.withdrawToken(tokenAddress, withdrawAmount, tokenDecimals, function(error,response){
         console.log(response)
      });

    });


    $('.btn-action-lava-transfer').off();
    $('.btn-action-lava-transfer').on('click',  function(){

      var selectedActionAsset = actionContainer.selectedActionAsset ;

      var tokenAddress = selectedActionAsset.address;
      var transferAmount = actionContainer.transferTokenQuantity;
      var transferRecipient = actionContainer.transferTokenRecipient;
      var transferRelayReward = actionContainer.transferTokenRelayReward;
      var tokenDecimals = selectedActionAsset.decimals;

      var method = 'transfer'; //could also be withdraw or approve


            console.log('lava transfer gen ', tokenAddress,  transferAmount, transferRecipient)
            self.generateLavaTransaction(method,tokenAddress, transferAmount, transferRecipient, transferRelayReward, tokenDecimals, function(error,response){
           console.log(response)
      });

    });

  }

  async selectActionAsset(address)
    {
      var self = this;

      var assetData = this.getAssetDataFromAddress(address)


      await Vue.set(actionContainer, "selectedActionAsset" , assetData);

      var supportsDelegateCallDeposit = (assetData.supportsDelegateCallDeposit == true)

      await Vue.set(actionContainer, "supportsDelegateCallDeposit" , supportsDelegateCallDeposit);

      await Vue.set(actionContainer, "shouldRender" , true);

      Vue.nextTick(function () {
         self.registerActionContainerClickHandler();
      })

    }

    async selectActiveAction(actionName)
      {
        var self = this;

        console.log('select active action',actionName);

        self.resetLavaPacket();

        await  Vue.set(actionContainer, "selectedActionType" , actionName);

        Vue.nextTick(function () {
           self.registerActionContainerClickHandler();
        })

      }

      async resetLavaPacket()
      {
        await  Vue.set(actionContainer, "lavaPacketExists" , false);
      }

    getAssetDataFromAddress(address)
    {
      console.log('get asset data ',address);




      var matchingToken  = defaultTokenData.find(t => t.address == address );

        console.log(matchingToken);

      return matchingToken  ;

    }


    async collectClientTokenBalances(tokenList,userAddress)
    {
      for(var i in tokenList)
      {
        var tokenData = tokenList[i];

        console.log(tokenData)

        var tokenDecimals = tokenData.decimals; //fix


        var tokenBalance = await this.getTokenBalance(tokenData.address, userAddress);
        tokenData.wallet_balance_formatted = this.formatAmountWithDecimals(tokenBalance,tokenDecimals);

        var tokenAllowance = await this.getTokenAllowance(tokenData.address, userAddress);
        tokenData.approved_balance_formatted = this.formatAmountWithDecimals(tokenAllowance,tokenDecimals);


        var lavaTokenBalance = await this.getLavaTokenBalance(tokenData.address, userAddress);
        tokenData.lava_balance_formatted = this.formatAmountWithDecimals(lavaTokenBalance,tokenDecimals);

        //get wallet balance and get lava balance


        //clientTokenData

      }


    }

    async getLavaTokenBalance(tokenAddress,tokenOwner)
    {
      var contract = this.ethHelper.getWeb3ContractInstance(
        this.web3,
        this.lavaWalletContract.blockchain_address,
        lavaContractABI.abi
      );

          console.log('get lava token balance')

      console.log(contract)


        console.log(tokenAddress,tokenOwner)

      var lavaBalance = await new Promise(resolve => {
        contract.balanceOf(tokenAddress,tokenOwner, function(error,response){
           resolve(response.toNumber());
           })
      });

      return lavaBalance;
    }

    async getTokenBalance(tokenAddress,tokenOwner)
    {
      var contract = this.ethHelper.getWeb3ContractInstance(this.web3,tokenAddress,erc20TokenABI.abi );

      var balance = await new Promise(resolve => {
        contract.balanceOf(tokenOwner, function(error,response){
            console.log(error,response)

            resolve(response.toNumber());

           })
      });

      return balance;
    }

    async getTokenAllowance(tokenAddress,tokenOwner)
    {
      var contract = this.ethHelper.getWeb3ContractInstance(this.web3,tokenAddress,erc20TokenABI.abi );

      var wallet_address = this.lavaWalletContract.blockchain_address;

      var balance = await new Promise(resolve => {
        contract.allowance(tokenOwner, wallet_address, function(error,response){
           resolve(response.toNumber());
           })
      });

      return balance;
    }


    async getTokenDecimals(tokenAddress)
    {
      var contract = this.ethHelper.getWeb3ContractInstance(this.web3,tokenAddress,erc20TokenABI.abi );


      var decimals = await new Promise(resolve => {
        contract.decimals( function(error,response){
           resolve(response.toNumber());
           })
      });

      return decimals;
    }

    //not used
      async updateWalletRender()
      {
        if(this.web3 == null)
        {
          console.log("No web3 to load wallet data.")
          return;
        }

          console.log( 'loading wallet data ')


          var activeAccount = web3.eth.accounts[0];

          accountAddress = activeAccount;

          console.log(accountAddress)



          var contract = this.ethHelper.getWeb3ContractInstance(this.web3  );


          let getDecimals = new Promise(resolve => {
            contract.decimals( function(error,response){
               resolve(response.toNumber());
               })
          });

          let getTokenBalance = new Promise(resolve => {
            contract.balanceOf(activeAccount, function(error,response){
               resolve(response.toNumber());
               })
          });

          var decimals = await getDecimals ;
          var tokenBalance = await getTokenBalance ;

          balanceText = tokenBalance / Math.pow(10,decimals);

      }



    detectInjectedWeb3()
    {



      if (typeof web3 !== 'undefined') {
          web3 = new Web3(web3.currentProvider);

          console.log(web3)

        if(typeof web3.eth !== 'undefined' && typeof web3.eth.accounts[0] !== 'undefined')
        {

          return web3;

        }else{

            console.log(web3.eth)
              console.log('acct',web3.eth.accounts[0])


          this.alertRenderer.renderError("No Web3 interface found.  Please login to Metamask or an Ethereum enabled browser.")
        }

      } else {

        console.error("no web3 found.")
        // set the provider you want from Web3.providers
        //web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        this.alertRenderer.renderError("No Web3 interface found.  Please install Metamask or use an Ethereum enabled browser.")

      }


      return null;
    }




  async getCurrentEthBlockNumber()
  {
   return await new Promise(function (fulfilled,error) {
          web3.eth.getBlockNumber(function(err, result)
        {
          if(err){error(err);return}
          console.log('eth block number ', result )
          fulfilled(result);
          return;
        });
     });

  }



  async getEscrowBalance(token_address,user)
  {
    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      lavaWalletContract.blockchain_address,
      lavaContractABI.abi
    );

    var balanceResult =  await new Promise(function (fulfilled,error) {
           contract.balanceOf.call(token_address,user,function(err,result){
             fulfilled(result);
           })
      });

      console.log('balanceResult',balanceResult.toNumber())

      return balanceResult.toNumber();
  }

  async getOrderAmountFilled(token_get,amount_get,token_give,amount_give,expires,nonce,user)
  {

    console.log('amount filledd',token_get,amount_get,token_give,amount_give,expires,nonce,user)
    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      lavaWalletContract.blockchain_address,
      lavaContractABI.abi
    );


    var filledResult =  await new Promise(function (fulfilled,error) {
           contract.amountFilled.call(token_get,amount_get,token_give,amount_give,expires,nonce,user,0,0,0,function(err,result){
             fulfilled(result);
           })
      });

      console.log('filledResult',filledResult)

      return filledResult.toNumber();

  }


  async depositEther(amountFormatted,callback)
  {
     console.log('deposit ether',amountRaw);

     var amountRaw = this.getRawFromDecimalFormat(amountFormatted,18)


     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       lavaWalletContract.blockchain_address,
       lavaContractABI.abi
     );

     console.log(contract)

     contract.deposit.sendTransaction(  {value: amountRaw}, callback);

  }

  async withdrawEther(amountFormatted,callback)
  {
    var amountRaw = this.getRawFromDecimalFormat(amountFormatted,18)

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       lavaWalletContract.blockchain_address,
       lavaContractABI.abi
     );

     console.log(contract)

     contract.withdraw.sendTransaction( amountRaw, callback);

  }



  //should be using approve and call!!!
  async ApproveAndCallDepositToken(tokenAddress,amountFormatted,tokenDecimals,callback)
  {
     console.log('deposit token',tokenAddress,amountRaw);

     var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)


     var remoteCallData = '0x01';

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       tokenAddress,
       _0xBitcoinABI.abi
     );

     console.log(contract)

     var approvedContractAddress = this.lavaWalletContract.blockchain_address;

     contract.approveAndCall.sendTransaction( approvedContractAddress, amountRaw, remoteCallData , callback);

  }


  async approveAndDepositToken(tokenAddress,amountFormatted,tokenDecimals,callback)
  {

    console.log('approve and deposit token',tokenAddress,amountRaw);

    var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)


    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      tokenAddress ,
      _0xBitcoinABI.abi
    );

    var spender = this.lavaWalletContract.blockchain_address;

    contract.approveAndCall.sendTransaction( spender, amountRaw , 0x0 , callback);

  }


  async approveToken(tokenAddress,amountFormatted,tokenDecimals,callback)
  {
     console.log('approve token',tokenAddress,amountRaw);

     var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)


     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       tokenAddress ,
       erc20TokenABI.abi
     );

     var spender = this.lavaWalletContract.blockchain_address;

     contract.approve.sendTransaction( spender, amountRaw , callback);

  }

  async depositToken(tokenAddress,amountFormatted,tokenDecimals,callback)
  {
     console.log('deposit token',tokenAddress,amountRaw);

     var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)


     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       this.lavaWalletContract.blockchain_address,
       lavaContractABI.abi
     );

     console.log(contract)

     var from = this.web3.eth.accounts[0];

     contract.depositTokens.sendTransaction( from, tokenAddress, amountRaw ,   callback);

  }


  async withdrawToken(tokenAddress,amountFormatted,tokenDecimals,callback)
  {
     console.log('withdraw token',tokenAddress,amountRaw);

     var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)


     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       this.lavaWalletContract.blockchain_address,
       lavaContractABI.abi
     );

     console.log(contract)

     contract.withdrawTokens.sendTransaction( tokenAddress, amountRaw , callback);

  }


  async generateLavaTransaction(method, tokenAddress, amountFormatted, transferRecipient, relayerRewardFormatted, tokenDecimals)
  {

    var self = this;


      var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)
      var relayerRewardRaw = this.getRawFromDecimalFormat(relayerRewardFormatted,tokenDecimals)


    //bytes32 sigHash = sha3("\x19Ethereum Signed Message:\n32",this, from, to, token, tokens, relayerReward, expires, nonce);
   //  address recoveredSignatureSigner = ECRecovery.recover(sigHash,signature);
   var ethBlock = await this.getCurrentEthBlockNumber();

  // var method = 'transfer'; //need a dropdown


   var walletAddress = this.lavaWalletContract.blockchain_address;
   var from = this.web3.eth.accounts[0];
   var to = transferRecipient;
   var tokenAddress = tokenAddress;
   var tokenAmount = amountRaw;
   var relayerReward = relayerRewardRaw;
   var expires = ethBlock + 1000;
   var nonce = web3utils.randomHex(16);

   //need to append everything together !! to be ..like in solidity.. :  len(message) + message

   const msgParams = LavaPacketHelper.getLavaParamsFromData(method,from,to,walletAddress,tokenAddress,tokenAmount,relayerReward,expires,nonce)


   console.log('generateLavaTransaction',tokenAddress,amountRaw,transferRecipient)


    //testing
    var sigHash = sigUtil.typedSignatureHash(msgParams);

    console.log('lava sigHash',msgParams,sigHash)



    var params = [msgParams, from]

    var signature = await this.signTypedData(params,from);



    console.log('lava signature',msgParams,signature)

    var packetJson = LavaPacketHelper.getLavaPacket(
      method,from,to,walletAddress,tokenAddress,tokenAmount,
      relayerReward,expires,nonce,signature)

      var lavaPacketString = JSON.stringify(packetJson);

      console.log('lava packet json ',  lavaPacketString );

      await  Vue.set(actionContainer, "lavaPacketExists" , true);
      await Vue.set(actionContainer, "lavaPacketData" , lavaPacketString);

      Vue.nextTick(function () {
        self.registerLavaPacketDownloadButton(lavaPacketString)
        self.registerLavaPacketBroadcastButton(lavaPacketString)
      })
  }

  async registerLavaPacketDownloadButton(lavaPacketString)
  {

      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lavaPacketString));
      $('#btn-download-lava-packet').empty();
      $('<a href="data:' + data + '" download="packet.lava" class="button is-primary btn-download-lava-packet">Download Lava Packet</a>').appendTo('#btn-download-lava-packet');


  }

  async registerLavaPacketBroadcastButton(lavaPacketString)
  {
    var self = this;

    $('.btn-broadcast-lava-packet').on('click',function(){
        self.broadcastLavaPacket(lavaPacketString)
    })


  }

  async broadcastLavaPacket(lavaPacketString)
  {
    console.log('broadcast ',lavaPacketString, actionContainer.relayNodeURL)

    var lavaPacketData = JSON.parse(lavaPacketString)

    console.log(lavaPacketData)

    var response = await LavaPacketUtil.sendLavaPacket(actionContainer.relayNodeURL, lavaPacketData)

    if(response.success)
    {
      await  Vue.set(actionContainer, "broadcastMessage" , "Success!");
    }else{
      await  Vue.set(actionContainer, "broadcastMessage" , response.message);
    }

    /*for(var i in lavaSeedNodes.seedNodes)
    {
      var seed = lavaSeedNodes.seedNodes[i];


      $.ajax({
          url: seed.address,
          type: 'POST',
          data: {lavaPacketString:lavaPacketString}
        });

    }*/


  }


  async signTypedData(params,from)
  {
    var result = await new Promise(async resolve => {

      //personal sign using Metamask
      var method = 'eth_signTypedData'

              web3.currentProvider.sendAsync({
                method,
                params,
                from,
              }, function (err, result) {
                if (err) return console.dir(err)
                if (result.error) {
                  alert(result.error.message)
                }
                if (result.error) return console.error(result)
                console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))


                  //this method needs to be in solidity!
                const recovered = sigUtil.recoverTypedSignature({ data: params[0], sig: result.result })



                  resolve(result.result)

              })


      });

      return result;
  }

/*
  async personalSign(msg,from)
  {
    var result = await new Promise(async resolve => {

      //sign(keccack256("\x19Ethereum Signed Message:\n" + len(message) + message)));
      //personal_ecRecover

        this.web3.personal.sign(msg, from, function (err, result) {
             if (err) return console.error(err)
             console.log('PERSONAL SIGNED:' + result)

             resolve(result);

           });

      });

      return result;
  }
*/
//nonce should just be a securerandom number !

  //initiated from a little form - makes a listrow
  async createOrder(tokenGet,amountGet,tokenGive,amountGive,expires,callback)
  {
     console.log('create order ',tokenGet,amountGet,tokenGive,amountGive,expires);

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       lavaWalletContract.blockchain_address,
       lavaContractABI.abi
     );

     console.log(contract)

     var nonce = web3utils.randomHex(32);

     contract.order.sendTransaction( tokenGet,amountGet,tokenGive,amountGive,expires, nonce, callback);

  }

  //initiated from clicking an order row
  async performTrade(tokenGet,amountGet,tokenGive,amountGive,expires,nonce, user, v,r,s, amount,  callback)
  {
    console.log(  'performTrade',tokenGet,amountGet,tokenGive,amountGive,expires,nonce, user, v,r,s, amount,  callback)

    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      lavaWalletContract.blockchain_address,
      lavaContractABI.abi
    );

     contract.trade.sendTransaction( tokenGet,amountGet,tokenGive,amountGive,expires,nonce, user, v,r,s, amount, callback);

  }



  async cancelOrder(tokenGet,amountGet,tokenGive,amountGive,expires,nonce,  v,r,s,   callback)
  {
    console.log(  'performTrade',tokenGet,amountGet,tokenGive,amountGive,expires,nonce,  v,r,s,   callback)

    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      lavaWalletContract.blockchain_address,
      lavaContractABI.abi
    );

     contract.cancelOrder.sendTransaction( tokenGet,amountGet,tokenGive,amountGive,expires,nonce,  v,r,s,  callback);

  }

  //maybe use web3 ??
  getDecimalsOfToken(token_address)
  {

    if(token_address!= 0 && token_address.toLowerCase() == _0xBitcoinContract.blockchain_address.toLowerCase())
    {
      return 8;
    }

    return 18;

  }


  getRawFromDecimalFormat(amountFormatted,decimals)
  {
    var amountRaw = amountFormatted * Math.pow(10,decimals)

    amountRaw = Math.floor(amountRaw)

    return amountRaw;
  }

  formatAmountWithDecimals(amountRaw,decimals)
  {
    var amountFormatted = amountRaw / (Math.pow(10,decimals) * 1.0)

  //  amountFormatted = Math.round(amountFormatted,decimals)

    return amountFormatted;
  }

 
}
