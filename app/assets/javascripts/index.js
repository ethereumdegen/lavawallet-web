
const $ = require('jquery');

import titleLogo from '../img/lavalogo4.png'
import githubLogo from '../img/GitHub-Mark-64px.png'
import redditLogo from '../img/reddit-mark-64px.png'
import contractQR from '../img/0xbitcoinContractQR.png'

import whiteLogo from '../img/logo.png'






import Vue from 'vue'

import AlertRenderer from './alert-renderer'
import HomeRenderer from './home-renderer'

import Navbar from './navbar'
import Landing from './landing'

import EthHelper from './ethhelper'

import LavaWalletHelper from './lava-wallet-helper'

import HomeDashboard from './home-dashboard'


var homeRenderer= new HomeRenderer()

var alertRenderer = new AlertRenderer();
var ethHelper = new EthHelper();
var navbar = new Navbar();
var landing = new Landing();

var lavaWalletHelper = new LavaWalletHelper();



import WalletDashboard from './wallet-dashboard'

var wallet = new WalletDashboard();


var pjson = require('../../../package.json');




var navbarComponent = new Vue({
  el: '#navbar',
  data: {
    titleLogo: titleLogo,
    githubLogo: githubLogo,
    redditLogo: redditLogo,
    contractQR: contractQR,
    projectVersion: pjson.version
  }
})


$(document).ready(function(){



    if($('#landing').length > 0)
    {
          console.log('load landing')

            landing.init();
    }

    if($('#wallet').length > 0)
    {

          navbar.init();

         lavaWalletHelper.init(alertRenderer,ethHelper);

    }


});


//dashboardRenderer.hide();
