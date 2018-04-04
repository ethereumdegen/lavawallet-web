
const $ = require('jquery');

var web3utils = require('web3-utils')

import Vue from 'vue'

var microDexABI = require('../contracts/MicroDex.json')
var _0xBitcoinABI = require('../contracts/_0xBitcoinToken.json')

var deployedContractInfo = require('../contracts/DeployedContractInfo.json')
var microDexContract;
var _0xBitcoinContract;

var balanceText;
var accountAddress;

var orderContainer;

var order_ask_list = [];
var order_bid_list = [];

var order_hash_table = {};

export default class MicroDexHelper {


  async init(alertRenderer, ethHelper)
  {
      this.alertRenderer=alertRenderer;
      this.ethHelper=ethHelper;


  await new Promise(async resolve => {
    web3.version.getNetwork((err, netId) => {
      switch (netId) {
        case "1":
          console.log('Web3 is using mainnet');
          microDexContract = deployedContractInfo.networks.mainnet.contracts.microdex;
          _0xBitcoinContract = deployedContractInfo.networks.mainnet.contracts._0xbitcointoken;
          break
        case "3":
          console.log('Web3 is using ropsten test network.');
          microDexContract = deployedContractInfo.networks.ropsten.contracts.microdex;
          _0xBitcoinContract = deployedContractInfo.networks.ropsten.contracts._0xbitcointoken;
          break
        default:
          console.log('This is an unknown network.')
      }

      resolve();
    })
  })


     this.web3 = this.detectInjectedWeb3();


     await this.updateWalletRender();





    var app = new Vue({
       el: '#wallet-titlebar',
       data: {account: accountAddress,
                  balance: balanceText,
                errorMessage: alertRenderer.alertMessage},

       methods: {
          update: function () {

          }
        }
     });


     var dexContract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     var activeAccount = web3.eth.accounts[0];


     var etherBalance = await new Promise(resolve => {
        dexContract.balanceOf(0,activeAccount,function(err,result){
          resolve(result)
        });
      });
     var tokenBalance = await new Promise(resolve => {
       dexContract.balanceOf(_0xBitcoinContract.blockchain_address,activeAccount, function(err,result){
           resolve(result)
          }) ;
         });


     var transfer = new Vue({
        el: '#transfer-form',
        data: {
          etherBalance: etherBalance.toNumber(),
          tokenBalance: tokenBalance.toNumber(),

          depositEtherAmount: 0,
          withdrawEtherAmount: 0,
          depositTokenAmount: 0,
          withdrawTokenAmount: 0
             },

        methods: {
           update: function () {

           }
         }
      });

       orderContainer = new Vue({
         el: '#order-form',
         data: {

           bidTokenGet: 0,
           bidTokenGive: 0,
           askTokenGet: 0,
           askTokenGive: 0,

           asks: {ask_list:order_ask_list},
           bids: {bid_list:order_bid_list}

              },

         methods: {
            update: function () {

            }
          }
       });

       await this.loadOrderEvents()





     if(this.web3 != null){
       console.log('show the app')
       //show the app
       $(".transfer-form-fields").show();


       var self = this;

       var tokenAddress = _0xBitcoinContract.blockchain_address;

       $('.btn-deposit-ether').on('click',function(){
         self.depositEther(transfer.depositEtherAmount,  function(error,response){
            console.log(response)
         });
       })

       $('.btn-withdraw-ether').on('click',function(){
         self.withdrawEther(transfer.withdrawEtherAmount,  function(error,response){
            console.log(response)
         });
       })

       $('.btn-deposit-0xbtc').on('click',function(){
         self.ApproveAndCallDepositToken(tokenAddress,transfer.depositTokenAmount,  function(error,response){
            console.log(response)
         });
       })

       $('.btn-withdraw-0xbtc').on('click',function(){
         self.withdrawToken(tokenAddress,transfer.withdrawTokenAmount,  function(error,response){
            console.log(response)
         });
       })





       var expires = 10000;


      //  tokenGet,amountGet,tokenGive,amountGive,expires,nonce


       $('.btn-bid-order').on('click',function(){
         self.createOrder(tokenAddress,order.bidTokenGet,0,order.bidTokenGive, expires, function(error,response){
            console.log(response)
         });
       })

       $('.btn-ask-order').on('click',function(){
         self.createOrder(0,order.askTokenGet,tokenAddress,order.askTokenGive, expires, function(error,response){
            console.log(response)
         });
       })





     }



  }




  //tough to get this to work !
  async registerOrderRowClickHandler()
  {

    console.log('register order row click handler')
    console.log($('.order-row').length)
     //need to do this after watch/render  happens
    $('.order-row').off();
    $('.order-row').on('click',async function(){
      var order_tx_hash = $(this).data('txhash');
      console.log('order_tx_hash',order_tx_hash);

      var order_element = JSON.parse( order_hash_table[order_tx_hash] );
      console.log('perform trade',order_element);


      //function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount) {

      var token_get = order_element.token_get;
      var token_give = order_element.token_give;
      var amount_get = order_element.amount_get;
      var amount_give = order_element.amount_give;
      var expires = order_element.expires;
      var nonce = order_element.nonce;

      var activeAccount = web3.eth.accounts[0];


      //amount get ...pegged at the entire order for now
      var trade_order_amount = order_element.amount_get;

      var micro_dex_address = microDexContract.blockchain_address;

      //NEED TO FIX MESSAGE SIGNING
      var message_to_sign = web3utils.soliditySha3(micro_dex_address,token_get,amount_get,token_give,amount_give,expires,nonce).toString();

      console.log('message_to_sign',message_to_sign);

      var order_sig = await new Promise(resolve => {
           web3.eth.sign(activeAccount, message_to_sign, resolve  );
      });

      console.log('sig',order_sig)
      /*
       var sigHash = web3utils.soliditySha3(requestRecipient, requestQuantity, requestToken, requestNonce)

          console.log(addressFrom)

          console.log(sigHash)

          var sigHashHex = Buffer.from(sigHash.substr(2, sigHash.length),'hex');

       var sig = ethUtil.ecsign(sigHashHex, Buffer.from(privateKey,'hex'))
    */

      this.performTrade(token_get,amount_get,token_give,amount_give,expires,nonce, activeAccount, sig_v,sig_r,sig_s, trade_order_amount,   function(error,response){
         console.log(response)
      });

    })


  }

  detectInjectedWeb3()
  {

    console.log('detect')
    console.log(web3)


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
      // set the provider you want from Web3.providers
      //web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      this.alertRenderer.renderError("No Web3 interface found.  Please install Metamask or use an Ethereum enabled browser.")

    }


    return null;
  }


  buildOrderElementFromEvent(order_event, base_pair_token_address)
  {
    console.log('build from ',order_event);
    console.log('base_pair_token_address ',base_pair_token_address);


    var order_element = {};

    order_element.token_give = order_event.args.tokenGive;
    order_element.token_get = order_event.args.tokenGet;
    order_element.amount_give = order_event.args.amountGive.toNumber();
    order_element.amount_get = order_event.args.amountGet.toNumber();

    order_element.expires = order_event.args.expires.toNumber();
    order_element.nonce = order_event.args.nonce.toNumber();
    order_element.user = order_event.args.user;

    order_element.tx_hash = order_event.transactionHash;
    order_element.tx_index = order_event.transactionIndex;


    //bids give eth
    if( order_element.token_give == "0x0000000000000000000000000000000000000000"
        && order_element.token_get.toLowerCase() ==  base_pair_token_address.toLowerCase())
    {
      order_element.order_type = "bid";
      order_element.cost_ratio = order_element.amount_get / order_element.amount_give;
    }

    //asks get eth
    if( order_element.token_get == "0x0000000000000000000000000000000000000000"
        &&  order_element.token_give.toLowerCase() ==  base_pair_token_address.toLowerCase())
    {
      order_element.order_type = "ask";
      order_element.cost_ratio = order_element.amount_get / order_element.amount_give;
    }

    order_hash_table[order_element.tx_hash] = JSON.stringify( order_element );


    return order_element;
  }

   renderOrderEvent(order_event, base_pair_token_address)
  {

    var self = this;

    var order_element = this.buildOrderElementFromEvent(order_event, base_pair_token_address);

    console.log('render',order_element);

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
            return a.cost_ratio - b.cost_ratio;
     })
     Vue.set(orderContainer, 'bids',  {bid_list: order_bid_list }  )
    }

    Vue.nextTick(function () {
      self.registerOrderRowClickHandler()
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

      var current_block = await new Promise(function (fulfilled,error) {
            web3.eth.getBlockNumber(function(err, result)
          {
            if(err){error(err);return}
            console.log('eth block number ', result )
            fulfilled(result);
            return;
          });
       });


       var self = this;

       var contract = this.ethHelper.getWeb3ContractInstance(
         this.web3,
         microDexContract.blockchain_address,
         microDexABI.abi
       );


       var base_pair_token_address = _0xBitcoinContract.blockchain_address;

       var myEvent = contract.Order({ }, {fromBlock: (current_block-10000), toBlock: current_block });

          myEvent.watch(function(error, result){
             //console.log(result)

             self.renderOrderEvent(result, base_pair_token_address )
          });

          // would get all past logs again.
        /*  var myResults = myEvent.get(function(error, logs){
            console.log(logs)
          });
        */

          // would stop and uninstall the filter
        //  myEvent.stopWatching();






    /* get all mint() transactions in the last N blocks */
    /* more info: https://github.com/ethjs/ethjs/blob/master/docs/user-guide.md#ethgetlogs */
    /* and https://ethereum.stackexchange.com/questions/12950/what-are-event-topics/12951#12951 */
  /*  ethjs.getLogs({
      fromBlock: current_block - num_eth_blocks_to_search,
      toBlock: current_block,
      address: '0xB6eD7644C69416d67B522e20bC294A9a9B405B31',
      topics: ['0xcf6fbb9dcea7d07263ab4f5c3a92f53af33dffc421d9d121e1c74b307e68189d', null],
    })
    .then((result) => {
      result.forEach(function(transaction){
        function getMinerAddressFromTopic(address_from_topic) {
          return '0x' + address_from_topic.substr(26, 41);
        }
        var tx_hash = transaction['transactionHash'];
        var block_number = parseInt(transaction['blockNumber'].toString());
        var miner_address = getMinerAddressFromTopic(transaction['topics'][1].toString());


        console.log('miner_address')

      });

    });*/

  }




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




  async depositEther(amountRaw,callback)
  {
     console.log('deposit ether',amountRaw);

     //amountRaw = 100000000000;

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     console.log(contract)

     contract.deposit.sendTransaction(  {value: amountRaw}, callback);

  }

  async withdrawEther(amountRaw,callback)
  {
     console.log

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     console.log(contract)

     contract.withdraw.sendTransaction( amountRaw, callback);

  }



  //should be using approve and call!!!
  async ApproveAndCallDepositToken(tokenAddress,amountRaw,callback)
  {
     console.log('deposit token',tokenAddress,amountRaw);

     var remoteCallData = '0x01';

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       _0xBitcoinContract.blockchain_address,
       _0xBitcoinABI.abi
     );

     console.log(contract)

     var approvedContractAddress = microDexContract.blockchain_address;

     contract.approveAndCall.sendTransaction( approvedContractAddress, amountRaw, remoteCallData , callback);

  }

  async withdrawToken(tokenAddress,amountRaw,callback)
  {
     console.log('withdraw token',tokenAddress,amountRaw);

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     console.log(contract)

     contract.withdrawToken.sendTransaction( tokenAddress, amountRaw , callback);

  }



//nonce should just be a securerandom number !

  //initiated from a little form - makes a listrow
  async createOrder(tokenGet,amountGet,tokenGive,amountGive,expires,callback)
  {
     console.log('withdraw token',tokenGet,amountGet,tokenGive,amountGive,expires);

     var contract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     console.log(contract)

     var nonce = web3utils.randomHex(32);

     contract.order.sendTransaction( tokenGet,amountGet,tokenGive,amountGive,expires, nonce, callback);

  }

  //initiated from clicking an order row
  async performTrade(tokenGet,amountGet,tokenGive,amountGive,expires,nonce, user, v,r,s, amount,  callback)
  {

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
