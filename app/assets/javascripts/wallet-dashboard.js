
const $ = require('jquery');

import Vue from 'vue'


var balanceText;
var accountAddress;





export default class WalletDashboard {


  async init(alertRenderer, ethHelper)
  {
      this.alertRenderer=alertRenderer;
      this.ethHelper=ethHelper;

      $(".transfer-form-fields").hide();



     this.web3 = this.detectInjectedWeb3();


     await this.updateWalletRender();

     console.log(accountAddress)

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

     var transfer = new Vue({
        el: '#transfer-form',
        data: {amount: 0,
                 recipient_address: null},

        methods: {
           update: function () {

           }
         }
      });



     if(this.web3 != null){
       $(".transfer-form-fields").show();


       var self = this;

       $(".start-transfer-button").on('click',function(){

         self.startTransfer(transfer.amount, transfer.recipient_address, function(error,response){

           console.log(response)
         });
       })
     }


  }


  detectInjectedWeb3()
  {

    console.log('detect')
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);

        console.log(web3)

      if(typeof web3.eth !== 'undefined' && typeof web3.eth.accounts[0] !== 'undefined')
      {

        return web3;

      }else{

          console.log(web3.eth)
            console.log(web3.eth.accounts[0])


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


  async startTransfer(amountRaw,recipient,callback)
  {


    var contract = this.ethHelper.getWeb3ContractInstance(this.web3);


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


}
