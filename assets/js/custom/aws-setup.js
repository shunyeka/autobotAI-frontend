class AWSSetup {
  constructor(options) { }
  async init() {
    let self = this;
    self.router = new Router();
    let setupProgress = await self.router.init();
    if(setupProgress){
      if (setupProgress.cspSetup == true && setupProgress.regionSet == false) {
        let awsRegionPref = new AWSRegionSelectModal({
          auto: true,
          force: true,
          edit: true,
          successCallback: function (token) {          
            self.fetchData(self.router.token);
          }
        });
      } else if (setupProgress.cspSetup == true && setupProgress.regionSet == true && setupProgress.dataFetched == false) {      
        self.fetchData(self.router.token);
      }      
      let cspAccountsTable = new CSPAccountsTable({
        container: '.csp-accounts-container',
        router: self.router
      });
    }  
    self.generateAccountSetupToken(self.router.token);          
    self.initEvents(self.router.token);
    Utilities.hideLoader('aws-setup.init');
  }

  initEvents(authToken) {
    let self = this;
    $('#verifyAccess').click(function (event) {
      self.handleVerifyAccess(event);
    });   
    var $input = $("#account-alias");
    $input.jqBootstrapValidation();
    $('#launch-stack-btn').click(function (event) {
      $input.trigger("change.validation", {submitting: true});
      if($input.jqBootstrapValidation('hasErrors')){
        event.preventDefault();
      }else{
        var externalId= $(this).data('externalId');
        self.setupAccountAlias(authToken,externalId);
        self.accountSetupPoling($(this).data('externalId'));
      }
    })
  }

  handleVerifyAccess(event) {
    let self = this;
    Utilities.showLoader(null, 'handleVerifyAccess');
    Auth.authToken.then(function setAuthToken(authToken) {
      self.verifyAccess(authToken);
    });
  }

  verifyAccess(authToken) {
    let self = this;
    $.ajax({
      method: 'POST',
      url: _config.api().verifyAccess,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        Router.getSetupProgress(authToken, function (setupProgress) {
          if (!setupProgress.regionSet) {
            let awsRegionPref = new AWSRegionSelectModal({
              auto: true,
              force: true,
              edit: true,
              successCallback: function (authToken) {                
                self.fetchData(authToken);
              }
            });
          } else if (!setupProgress.dataFetched) {            
            self.fetchData(authToken);
          } else {
            self.router.reouteOnDataFetchCompletion(authToken);
          }
        });
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader('verifyAccess.ajax.error');
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  generateAccountSetupToken(authToken) {
    Utilities.showLoader(null, 'generateAccountSetupToken.init');
    $.ajax({
      method: 'POST',
      url: _config.api2().accountSetupInit,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        $('#launch-stack-btn').prop('href', _config.accountSetup.launchStackTemplateUrl + "&param_ExternalID=" + result.externalId);
        $('#launch-stack-btn').data('externalId', result.externalId)
        Utilities.hideLoader('generateAccountSetupToken.ajax.success');
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader('generateAccountSetupToken.ajax.error');
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  setupAccountAlias(authToken,externalId){
    Utilities.showLoader(null, 'generateAccountSetupToken.init');
    let alias = $('#account-alias').val();
    if(authToken == null || externalId == '' || alias == ''){
      return;
    }
    var accountUpdateData={
      "externalId":externalId,
      "accountSetupAlias":alias
    };
    $.ajax({
      method: "PUT",
      url: _config.api2().accountSetupInit,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      data:JSON.stringify(accountUpdateData),
      success: function () {
        Utilities.hideLoader('generateAccountSetupToken.ajax.success');
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader('generateAccountSetupToken.ajax.error');
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }
  fetchData(authToken) {
    Utilities.showLoader('We are analysing your Cloud infrastructure. This may take some time. Please check back in sometime.', 'fetchData')
    let self = this;
    $.ajax({
      method: 'POST',
      url: _config.api2().fetchData,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        if (result.success == true) {          
          self.router.reouteOnDataFetchCompletion(authToken);
        } else {
          Utilities.hideLoader('fetchData.ajax.successFalse');
          $.notify({
            message: 'Unable to analyse infrastructure. Please verify account setup is completed.'
          }, {
              type: 'danger'
            });
          self.router.handleOtherPageRouting(authToken, true);
        }
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader('fetchData.ajax.error');
        window.Router.handleOtherPageRouting(authToken, true);
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  accountSetupPoling(externalId) {
    Utilities.showLoader('Waiting for you to complete account setup...', 'launchStackButn.Click')
    let self = this;
    function accountSetupProgress(authToken, externalId) {
      Router.getSetupProgress(authToken, null, externalId).then(function(setupProgress){
        if (setupProgress.accountId) {
          Utilities.hideLoader('accountSetupProgress.setupProgress.accountId');
          clearInterval(accountSetupProgressInterval); 
          Utilities.setCurrentAccount(setupProgress.accountId);
          let awsRegionPref = new AWSRegionSelectModal({
            auto: true,
            force: true,
            edit: true,
            successCallback: function (authToken) {              
              self.fetchData(authToken);
            }
          });
        }
      });      
    }

    var accountSetupProgressInterval = setInterval(function () {
      accountSetupProgress(self.router.token, externalId);
    }, 10000);

    setTimeout(function () {
      clearInterval(accountSetupProgressInterval);
      Utilities.hideLoader();
      $.notify({
        message: 'Fetch data process has failed. Please contact support'
      }, {
          type: 'danger'
        });
    }, 300000);
  }
}

$(document).ready(function () {
  let awsSetup = new AWSSetup();
  awsSetup.init();
});