class Router {
  constructor(options) {
    var defaults = {
      pageReadyCallback: null,
      token: null
    }
    if (options && typeof options === "object") {
      this.options = Utilities.extendDefaults(defaults, options);
    }
  }

  async init() {
    $('.logout').click(function () {
      Auth.signOut();
    });
    try {
      let self = this;
      let authToken = await Auth.authToken;
      self.token = authToken ? authToken : (self.options ? self.options.token : null);
      if (self.token) {        
        if (await self.fetchUserPreferences() && self.checkAuthorization()) {          
          let setupProgress = await Router.getSetupProgress(self.token);
          return setupProgress;
        }                
        return false;
      }
      if (window.location.pathname.indexOf('auth.html') < 0) {
        Utilities.navigateToPage(_config.pages.signIn);
      }
    } catch (error) {
      console.log('Some error occured while router init');
      console.log(error);
      if (error.name === 'NotAuthorizedException') {
        Utilities.navigateToPage(_config.pages.signIn);
      }
    }
    return false;
  }

  checkAuthorization(){    
    var userType = Utilities.getStorageItem('userType');    
    var rootOnlyPages = [
      "user-ce.html",
      "user-management.html"      
    ]
    if(userType === 'SUBUSER'){
      $('i.fa.fa-users').closest('.dropdown-item').remove();
      var page = location.pathname.split('/').pop();      
      if (rootOnlyPages.includes(page)){        
        bootbox.dialog({ 
            title: 'UNAUTHORIZED',
            message: '<p>You are not authorized to use this functionality. Navigate to <a href="'+_config.pages.dashboard+'">Dashboard</a></p>',
            size: 'large',
            onEscape: false,
            backdrop: true,
            closeButton: false 
        });
        setTimeout(function () {
          console.log('page to redirect to'+_config.pages.dashboard)
          Utilities.navigateToPage(_config.pages.dashboard)
        }, 5000);
        return false;
      }
    }
    return true;
  }

  async fetchUserPreferences() {
    const self = this;
    try {
      let response = await $.ajax({
        method: 'GET',
        url: _config.api2().userDetails,
        headers: {
          Authorization: self.token,
        },
        contentType: 'application/json'
      });
      if (response.success) {        
        Utilities.saveUserPreferences(response.user.preferences);
        delete response.user.preferences
        Utilities.saveUserDetails(response.user)
        return true;
      }
      Utilities.navigateToPageGroups(_config.pageGroups.integrations);     
    } catch (error) {
      Utilities.navigateToPageGroups(_config.pageGroups.integrations);
    }
    return false;
  }

  static async getSetupProgress(authToken, accountId = null, externalId = null) {
    let url = _config.api2().cspAccounts
    console.log('Passed account id is =' + accountId);
    if (accountId) {
      url += '/' + accountId
    } else if (externalId) {
      url += '?externalId=' + externalId
    } else {
      url += '/' + Utilities.getCurrentAccount()
    }
    let result = await $.ajax({
      method: 'GET',
      url: url,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
    });
    let setupProgress = {
      accountId: null,
      cspSetup: false,
      regionSet: false,
      dataFetched: false,
      tagResources: false,
      assistantLinked: false,
    }
    if (result && result.success && (result.account || (result.accounts && result.accounts.length > 0))) {
      const account = result.account || result.accounts[0];
      setupProgress = {
        accountId: account.accountId,
        cspSetup: account.isActive || !account.isUnauthorized || false,
        regionSet: account.defaultRegion || account.activeRegions ? true : false,
        dataFetched: (account.isActive && !account.isUnauthorized && account.lastIndexedAt) ? true : false,
        tagResources: account.isResourcesTagged,
        assistantLinked: false,
      }
    }
    return setupProgress;
  }
  static handleLoginSuccessRouting(setupProgress) {
    if (setupProgress.cspSetup == false || setupProgress.regionSet == false || setupProgress.dataFetched == false) {
      Utilities.navigateToPageGroups(_config.pageGroups.integrations);
    } else if (setupProgress.tagResources == false) {
      Utilities.navigateToPage(_config.pages.tagResources);
    } else {
      Utilities.navigateToPage(_config.pages.dashboard);
    }
  }

  handleOtherPageRouting(authToken) {
    console.log('handleOtherPageRouting called');
  }

  async reouteOnDataFetchCompletion() {
    let self = this;
    console.log('reouteOnDataFetchCompletion');

    async function checkDataFetchProgress(authToken) {
      console.log('checkDataFetchProgress called');
      let setupProgress = await Router.getSetupProgress(authToken);
      console.log('checkDataFetchProgress status is ' + setupProgress.dataFetched);
      if (setupProgress.dataFetched == true) {
        if (setupProgress.tagResources == false) {
          Utilities.navigateToPage(_config.pages.tagResources);
        } else {
          Utilities.navigateToPage(_config.pages.dashboard);
        }
      }
    }

    var checkDataFetchProgressInterval = setInterval(async function () {
      await checkDataFetchProgress(self.token);
    }, 10000);

    setTimeout(function () {
      console.log('timeout called');
      clearInterval(checkDataFetchProgressInterval);
      Utilities.hideLoader();
      $.notify({
        message: 'Fetch data process has failed. Please contact support'
      }, {
          type: 'danger'
        });
    }, 300000);
  }
}