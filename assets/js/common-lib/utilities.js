class Utilities {
  constructor() { }

  static isLocal() {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      return true;
    }
    return false;
  }

  static getStorageItem(key) {
    let value = window.localStorage.getItem(key);
    if (value !== 'undefined' && value !== 'null') {
      return value;
    }
    return null;
  }

  static getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  };

  static extendDefaults(source, properties) {
    var property;
    for (property in properties) {
      if (properties.hasOwnProperty(property)) {
        source[property] = properties[property];
      }
    }
    return source;
  }

  static showLoader(message, caller = '') {
    $('#loader').find('h3').text(message);
    if (Utilities.loaderStack == 0) {
      $('#loader').show();
    }
    Utilities.loaderStack += 1
  }
  static hideLoader(caller = '') {
    if (Utilities.loaderStack != 0) {
      Utilities.loaderStack -= 1
    }
    if (Utilities.loaderStack < 1) {
      $('#loader').find('h3').text('');
      $('#loader').hide();
    }
  }

  static saveUserPreferences(userPreferences) {
    Object.keys(userPreferences).forEach(e => {
      if (userPreferences[e]) {
        window.localStorage.setItem(e, userPreferences[e]);
      }
    });
  }

  static saveUserDetails(details) {
    Object.keys(details).forEach(e => {
      if (details[e]) {
        window.localStorage.setItem(e, details[e]);
      }
    });
  }

  static setCurrentAccount(accountId) {
    if (accountId) {
      return window.localStorage.setItem('currentAccount', accountId);
    }
  }

  static getCurrentAccount() {
    if (Utilities.getStorageItem('currentAccount') !== null) {
      return Utilities.getStorageItem('currentAccount')
    } else {
      return Utilities.getStorageItem('defaultAccount')
    }
  }

  static printDiv(selector) {
    window.frames["print_frame"].document.body.innerHTML = document.querySelector(selector);
    window.frames["print_frame"].window.focus();
    window.frames["print_frame"].window.print();
  }

  static navigateToPageGroups(group){
    if (window.location.href.indexOf(group.group) <= 0) {
      window.location.href = group.index;
    } else {
      Utilities.hideLoader();
    }
  }

  static handleUnauthorized(){
    Utilities.hideLoader();
    $.notify({
      message: 'We are unable to access this AWS account. Please do the account setup again or chose a different account.'
    }, {
      type: 'danger'
    });
  }

  static navigateToPage(page) {        
    if (window.location.href.indexOf(page) <= 0) {
      window.location.href = page;
    } else {
      Utilities.hideLoader();
    }
  }

  static showAlert(message, type, delay=3000) {
    $.notify({
      message: message
    }, {
        type: type,
        delay: delay
      });
  }

  static cleanupStorage() {
    let keysToClean = ["currentAccount", "defaultAccount"]
    for (const key of keysToClean) {
      window.localStorage.removeItem(key);
    }
  }

  static showAlertNoAws() {
    if (window.location.href.indexOf('aws-account-setup.html') <= 0) {
      $.notify({
        message: 'You have not setup AWS account or setup is not completed yet. Redirecting you to Account Setup Page'
      }, {
          type: 'danger'
        });
      setTimeout(function () {
        Utilities.navigateToPage()      
      }, 3000);
    }    
  }
}

Utilities.loaderStack = 1;

String.prototype.capitalize = function () {
  if (this.length > 0) {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
  return this;
}

jQuery.loadScript = function (url, callback) {
  jQuery.ajax({
      url: url,
      dataType: 'script',
      success: callback,
      async: true
  });
}