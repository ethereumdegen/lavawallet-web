
const $ = require('jquery');

import Vue from 'vue'

var microDexABI = require('../contracts/MicroDex.json')
var _0xBitcoinABI = require('../contracts/_0xBitcoinToken.json')

var deployedContractInfo = require('../contracts/DeployedContractInfo.json')
var microDexContract;
var _0xBitcoinContract;

var balanceText;
var accountAddress;





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


     var microDexContract = this.ethHelper.getWeb3ContractInstance(
       this.web3,
       microDexContract.blockchain_address,
       microDexABI.abi
     );

     var activeAccount = web3.eth.accounts[0];


     var etherBalance = await new Promise(resolve => {
        microDexContract.balanceOf(0,activeAccount,function(err,result){
          resolve(result)
        });
      });
     var tokenBalance = await new Promise(resolve => {
       microDexContract.balanceOf(_0xBitcoinContract.blockchain_address,activeAccount, function(err,result){
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

     }



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

  async updateWalletRender()
  {
    if(this.web3 != null)
    {
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
