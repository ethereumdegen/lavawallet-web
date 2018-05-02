
const $ = require('jquery');

var web3utils = require('web3-utils')
var sigUtil = require('eth-sig-util')

import Vue from 'vue'

import LavaPacketHelper from './lava-packet-helper'
//const lavaPacketHelper = new LavaPacketHelper();

var lavaWalletABI = require('../contracts/LavaWallet.json')
var _0xBitcoinABI = require('../contracts/_0xBitcoinToken.json')
var erc20TokenABI = require('../contracts/ERC20Interface.json')

var tokenData = require('../config/token-data.json')
var defaultTokens = require('../config/default-tokens.json')

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

    self.networkVersion = 'mainnet';

   if(this.web3 != null)
   {



      await new Promise(async resolve => {
        web3.version.getNetwork((err, netId) => {
          switch (netId) {
            case "1":
              self.networkVersion = 'mainnet';
              console.log('Web3 is using mainnet');
              self.lavaWalletContract = deployedContractInfo.networks.mainnet.contracts.lavawallet;
              self._0xBitcoinContract = deployedContractInfo.networks.mainnet.contracts._0xbitcointoken;
              break
            case "3":
              self.networkVersion = 'testnet';
              console.log('Web3 is using ropsten test network.');
              self.lavaWalletContract = deployedContractInfo.networks.ropsten.contracts.lavawallet;
              self._0xBitcoinContract = deployedContractInfo.networks.ropsten.contracts._0xbitcointoken;
              break
            default:
              console.log('This is an unknown network.')
          }

          resolve();
        })
      })


      // init defaultTokenData
         defaultTokenData = defaultTokens.tokens.map(symbol => tokenData.tokens.find(function(t) {
              return t.symbol == symbol;
              }) );






        console.log(defaultTokenData)

         defaultTokenData.map(t => t.icon_url = "/app/assets/img/token_icons/"+t.address+".png"   )

        if(self.networkVersion != 'mainnet')
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

        actionContainer = new Vue({
         el: '#action-container',
         data: {
                 selectedActionAsset: {name: 'nil'},
                 shouldRender: false,
                 selectedActionType: 'deposit',
                 approveTokenQuantity: 0,
                 depositTokenQuantity: 0,
                 withdrawTokenQuantity: 0,
                 transferTokenQuantity: 0,
                 transferTokenRecipient : 0,
                 transferTokenRelayReward: 0,
                 lavaPacketData: null
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
     lavaWalletABI.abi
   );

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


            console.log('lava transfer gen ', tokenAddress,  transferAmount, transferRecipient)
            self.generateLavaTransaction(tokenAddress, transferAmount, transferRecipient, transferRelayReward, tokenDecimals, function(error,response){
           console.log(response)
      });

    });

  }

  async selectActionAsset(address)
    {
      var self = this;

      var assetData = this.getAssetDataFromAddress(address)


      await Vue.set(actionContainer, "selectedActionAsset" , assetData);

      await Vue.set(actionContainer, "shouldRender" , true);

      Vue.nextTick(function () {
         self.registerActionContainerClickHandler();
      })

    }

    async selectActiveAction(actionName)
      {
        var self = this;

        console.log('select active action',actionName);

        await  Vue.set(actionContainer, "selectedActionType" , actionName);

        Vue.nextTick(function () {
           self.registerActionContainerClickHandler();
        })

      }

    getAssetDataFromAddress(address)
    {
      console.log('get asset data ',address);

      console.log(defaultTokenData);


      var matchingToken  = defaultTokenData.find(t => t.address == address );

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
        lavaWalletABI.abi
      );

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





/*
  async registerOrderRowClickHandler()
  {

    var self = this;

    console.log('register order row click handler')
    console.log('trading rows', $('.trading-row').length)
     //need to do this after watch/render  happens
    $('.trading-row').off();
    $('.trading-row').on('click',async function(){
      var order_hash = $(this).data('orderhash');
      console.log('order_hash',order_hash);

      var order_element = JSON.parse( order_hash_table[order_hash] );
      console.log('perform trade',order_element);


      //function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount) {

      var token_get = order_element.token_get;
      var token_give = order_element.token_give;
      var amount_get = order_element.amount_get;
      var amount_give = order_element.amount_give;
      var expires = order_element.expires;
      var nonce = "0x"+order_element.nonce.toString();

      var makerAddress = order_element.user;


      //amount get ...pegged at the entire order for now
      var trade_order_amount = order_element.amount_get;


      var lava_wallet_address = lavaWalletContract.blockchain_address;

      //dont need offchain sigs - all orders will be on chain for now
      var sig_v = 0;
      var sig_r = 0;
      var sig_s = 0;


      self.performTrade(token_get,amount_get,token_give,amount_give,expires,nonce, makerAddress, sig_v,sig_r,sig_s, trade_order_amount,   function(error,response){
         console.log(response)
      });

    })

    $('.monitor-order-row').off();
    $('.monitor-order-row').on('click',async function(){
      console.log('should cancel order')

      var order_hash = $(this).data('orderhash');
      console.log('order_hash',order_hash);

      var order_element = JSON.parse( order_hash_table[order_hash] );
      console.log('perform trade',order_element);


      var token_get = order_element.token_get;
      var token_give = order_element.token_give;
      var amount_get = order_element.amount_get;
      var amount_give = order_element.amount_give;
      var expires = order_element.expires;
      var nonce = "0x"+order_element.nonce.toString();


      var lava_wallet_address = lavaWalletContract.blockchain_address;

      //dont need offchain sigs - all orders will be on chain for now
      var sig_v = 0;
      var sig_r = 0;
      var sig_s = 0;




      self.cancelOrder(token_get,amount_get,token_give,amount_give,expires,nonce,  sig_v,sig_r,sig_s,   function(error,response){
         console.log(response)
      });

    });


  }

*/


  /*async buildOrderElementFromEvent(order_event, base_pair_token_address,lava_wallet_address,currentEthBlock)
  {
    console.log('build from ',order_event);
    console.log('base_pair_token_address ',base_pair_token_address);





    var order_element = {};

    order_element.token_give = order_event.args.tokenGive;
    order_element.token_get = order_event.args.tokenGet;
    order_element.amount_give = order_event.args.amountGive.toNumber();
    order_element.amount_get = order_event.args.amountGet.toNumber();

    order_element.expires = order_event.args.expires.toNumber();

    console.log('order_event.args.nonce',order_event.args.nonce)
    order_element.nonce = web3utils.toBN(order_event.args.nonce ).toString(16) ;
    order_element.user = order_event.args.user;

    order_element.tx_hash = order_event.transactionHash;
    order_element.tx_index = order_event.transactionIndex;

    order_element.order_hash = web3utils.soliditySha3(
      lava_wallet_address,
      order_element.token_get,
      order_element.amount_get,
      order_element.token_give,
      order_element.amount_give,
      order_element.expires,
      order_element.nonce
    )

    console.log('order_element.order_hash',order_element.order_hash)

     //laggy but oh well
    order_element.amount_filled = await this.getOrderAmountFilled(
                                    order_element.token_get,
                                    order_element.amount_get,
                                    order_element.token_give,
                                    order_element.amount_give,
                                    order_element.expires,
                                    order_event.args.nonce,
                                    order_element.user
                                  )


    var client_taker_balance = client_token_balances[order_element.token_get];

    if(client_taker_balance < order_element.amount_get )
    {
      order_element.client_unable = true;
    }

    var maker_give_balance = await this.getEscrowBalance(order_element.token_give,order_element.user)

    if(maker_give_balance < order_element.amount_give )
    {
      order_element.impossible = true;
    }

    if(order_element.expires < currentEthBlock )
    {
      order_element.expired = true;
    }

    if(order_element.amount_filled >= order_element.amount_get
    ||  order_element.expired
    ||  order_element.impossible
    )
    {
      order_element.closed = true;
    }

    //fix me
    order_element.amount_get_remaining = 0;
    order_element.amount_give_remaining = 0;



        var give_decimal_places = 18;
        var get_decimal_places = 18;



    console.log('order_element.nonce',order_element.nonce )
    //bids give eth
    if( order_element.token_give == "0x0000000000000000000000000000000000000000"
        && order_element.token_get.toLowerCase() ==  base_pair_token_address.toLowerCase())
    {
      get_decimal_places = 8;
      order_element.order_type = "bid";

      order_element.amount_get_formatted = this.formatAmountWithDecimals(order_element.amount_get,get_decimal_places);
      order_element.amount_give_formatted = this.formatAmountWithDecimals(order_element.amount_give,give_decimal_places);

      order_element.cost_ratio = order_element.amount_give_formatted / order_element.amount_get_formatted;

    }

    //asks get eth
    if( order_element.token_get == "0x0000000000000000000000000000000000000000"
        &&  order_element.token_give.toLowerCase() ==  base_pair_token_address.toLowerCase())
    {
      give_decimal_places = 8;
      order_element.order_type = "ask";

      console.log("found ask " , JSON.stringify(order_element))

      order_element.amount_get_formatted = this.formatAmountWithDecimals(order_element.amount_get,get_decimal_places);
      order_element.amount_give_formatted = this.formatAmountWithDecimals(order_element.amount_give,give_decimal_places);

      order_element.cost_ratio = order_element.amount_get_formatted / order_element.amount_give_formatted;

    }


    if(order_element.cost_ratio < 0.0000000001 )
    {
      order_element.cost_ratio = 0;
    }


    order_hash_table[order_element.order_hash] = JSON.stringify( order_element );


    return order_element;
  }

*/

  /*collectCancelEvent(cancel_event, base_pair_token_address)
  {
    console.log('cancel',cancel_event)
    var cancel_element = cancel_event;

    cancel_element.tx_hash = cancel_event.transactionHash;
    cancel_element.cancelled = true;

    order_cancels_list.push(cancel_element)

    closed_order_hash_table[cancel_element.tx_hash] = cancel_element;

  }*/


/*  collectTradeEvent(trade_event, base_pair_token_address)
  {
    console.log('trade',trade_event)
    var trade_element = trade_event;


    if(traded_order_hash_table[trade_element.tx_hash]!=null)
    {
      trade_element = traded_order_hash_table[trade_element.tx_hash]

      trade_element.amount_get_traded += trade_event.args.amountGive.toNumber();
      trade_element.amount_give_traded += trade_event.args.amountGet.toNumber()

    }

    trade_element.token_give = trade_event.args.tokenGive;
    trade_element.token_get = trade_event.args.tokenGet;
    trade_element.amount_give = trade_event.args.amountGive.toNumber();
    trade_element.amount_get = trade_event.args.amountGet.toNumber();



    trade_element.tx_hash = trade_event.transactionHash; //not reliable ?
    trade_element.traded = true;

    recent_trades_list.push(trade_element)



    if(fully_traded)
    {
      trade_element.cancelled = true;
      closed_order_hash_table[trade_element.tx_hash] = trade_element;
    }

    traded_order_hash_table[trade_element.tx_hash] = trade_element;

  }*/

   async collectOrderEvent(order_event, base_pair_token_address, lava_wallet_address,currentEthBlock)
  {

    var self = this;

    var activeAccount = web3.eth.accounts[0];


    var order_element = await this.buildOrderElementFromEvent(order_event, base_pair_token_address, lava_wallet_address,currentEthBlock);

    console.log('render',order_element);

    if(order_element.closed != true){
      if(order_element.order_type == "ask")
      {
        order_ask_list.push(order_element);
        order_ask_list.sort(function(a, b) {
              return a.cost_ratio - b.cost_ratio;
       })
       Vue.set(orderContainer, 'asks',  {ask_list: order_ask_list }  )
      }

      if(order_element.order_type == "bid")
      {
        order_bid_list.push(order_element);
        order_bid_list.sort(function(a, b) {
              return b.cost_ratio - a.cost_ratio;
       })
       Vue.set(orderContainer, 'bids',  {bid_list: order_bid_list }  )
      }
    }



    if(order_element.user.toLowerCase() == activeAccount.toLowerCase())
    {
        this.collectMyOrder(order_element);
    }

    Vue.nextTick(function () {
      self.registerOrderRowClickHandler()
    })
  }


  collectMyOrder(order_element)
  {
    console.log('my order',order_element)
    my_orders_list.push(order_element);
    my_orders_list.sort(function(a, b) {
          return a.expires - b.expires;
   })
  }




  async loadOrderEvents()
  {
      if(this.web3 == null)
      {
        console.log("No web3 to load order events.")
        return;
      }

      var num_eth_blocks_to_search = 400;

      var web3 = this.web3;

      var current_block = await this.getCurrentEthBlockNumber()


       var self = this;

       var contract = this.ethHelper.getWeb3ContractInstance(
         this.web3,
         lavaWalletContract.blockchain_address,
         lavaWalletABI.abi
       );


       var lava_wallet_address = lavaWalletContract.blockchain_address;

       var base_pair_token_address = _0xBitcoinContract.blockchain_address;

     //none


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
      lavaWalletABI.abi
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
      lavaWalletABI.abi
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
       lavaWalletABI.abi
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
       lavaWalletABI.abi
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
       lavaWalletABI.abi
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
       lavaWalletABI.abi
     );

     console.log(contract)

     contract.withdrawTokens.sendTransaction( tokenAddress, amountRaw , callback);

  }


  async generateLavaTransaction(tokenAddress, amountFormatted, transferRecipient, relayerRewardFormatted, tokenDecimals)
  {

    var self = this;


      var amountRaw = this.getRawFromDecimalFormat(amountFormatted,tokenDecimals)
      var relayerRewardRaw = this.getRawFromDecimalFormat(relayerRewardFormatted,tokenDecimals)


    //bytes32 sigHash = sha3("\x19Ethereum Signed Message:\n32",this, from, to, token, tokens, relayerReward, expires, nonce);
   //  address recoveredSignatureSigner = ECRecovery.recover(sigHash,signature);
   var ethBlock = await this.getCurrentEthBlockNumber();


   var walletAddress = this.lavaWalletContract.blockchain_address;
   var from = this.web3.eth.accounts[0];
   var to = transferRecipient;
   var tokenAddress = tokenAddress;
   var tokenAmount = amountRaw;
   var relayerReward = relayerRewardRaw;
   var expires = ethBlock + 10000;
   var nonce = web3utils.randomHex(16);

   //need to append everything together !! to be ..like in solidity.. :  len(message) + message

   const msgParams = [

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

//    var solidity_msg = this.web3.toHex( "\x19Ethereum Signed Message:\n" + '32' + msg);

    console.log('generateLavaTransaction',tokenAddress,amountRaw,transferRecipient)


    //testing
    var sigHash = sigUtil.typedSignatureHash(msgParams);

    console.log('lava sigHash',msgParams,sigHash)



    var params = [msgParams, from]

    var signature = await this.signTypedData(params,from);


    console.log('lava signature',msgParams,signature)

    var packetJson = LavaPacketHelper.getLavaPacket(
      from,to,walletAddress,tokenAddress,tokenAmount,
      relayerReward,expires,nonce,signature)

      var lavaPacketString = JSON.stringify(packetJson);

      console.log('lava packet json ',  lavaPacketString );

      await Vue.set(actionContainer, "lavaPacketData" , lavaPacketString);

      Vue.nextTick(function () {
        self.registerLavaPacketDownloadButton(lavaPacketString)

      })
  }

  async registerLavaPacketDownloadButton(lavaPacketString)
  {

      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lavaPacketString));
      $('#btn-download-lava-packet').empty();
      $('<a href="data:' + data + '" download="packet.lava" class="button is-primary btn-download-lava-packet">Download Lava Packet</a>').appendTo('#btn-download-lava-packet');


  }




  async signTypedData(params,from)
  {
    var result = await new Promise(async resolve => {

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

//nonce should just be a securerandom number !

  //initiated from a little form - makes a listrow
  async createOrder(tokenGet,amountGet,tokenGive,amountGive,expires,callback)
  {
     console.log('create order ',tokenGet,amountGet,tokenGive,amountGive,expires);

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       lavaWalletContract.blockchain_address,
       lavaWalletABI.abi
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
      lavaWalletABI.abi
    );

     contract.trade.sendTransaction( tokenGet,amountGet,tokenGive,amountGive,expires,nonce, user, v,r,s, amount, callback);

  }



  async cancelOrder(tokenGet,amountGet,tokenGive,amountGive,expires,nonce,  v,r,s,   callback)
  {
    console.log(  'performTrade',tokenGet,amountGet,tokenGive,amountGive,expires,nonce,  v,r,s,   callback)

    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3,
      lavaWalletContract.blockchain_address,
      lavaWalletABI.abi
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

/*

  //Use as a reference only!!!
  async startTransfer(amountRaw,recipient,callback)
  {


    var contract = this.ethHelper.getWeb3ContractInstance(
      this.web3
    );


    let getDecimals = new Promise(resolve => {
      contract.decimals( function(error,response){
         resolve(response.toNumber());
         })
    });

    var decimals = await getDecimals;

    var amount = amountRaw * Math.pow(10,decimals)

    console.log('start transfer', amount , recipient)

    contract.transfer.sendTransaction(recipient, amount, callback);


  }

*/
}
