
const $ = require('jquery');

import logo from '../img/0xbitcoin.png'
import titleLogo from '../img/logo-dark.png'
import githubLogo from '../img/GitHub-Mark-64px.png'
import redditLogo from '../img/reddit-mark-64px.png'
import contractQR from '../img/0xbitcoinContractQR.png'

import whiteLogo from '../img/logo.png'






import Vue from 'vue'

import AlertRenderer from './alert-renderer'
import HomeRenderer from './home-renderer'

import navbar from './navbar'

import EthHelper from './ethhelper'

import HomeDashboard from './home-dashboard'


var homeRenderer= new HomeRenderer()

var alertRenderer = new AlertRenderer();
var ethHelper = new EthHelper();



var navbarComponent = new Vue({
  el: '#navbar',
  data: {
    titleLogo: titleLogo,
    githubLogo: githubLogo,
    redditLogo: redditLogo,
    contractQR: contractQR
  }
})


$(document).ready(function(){


    if($("#home").length > 0){
      var web3 = ethHelper.init( alertRenderer);

      homeRenderer.init(ethHelper);
    }


    navbar.init();



});


//dashboardRenderer.hide();
