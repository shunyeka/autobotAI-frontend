class AccountSelector {
  constructor(options) {    
    let self = this;
    Utilities.showLoader();
    var defaults = {
      container: 'div.account-select',
      showAllOption: false,
      template: `<a class="dropdown-item account-option px-3 py-0" href="#"><i class="fa fa-cloud"></i><label class="alias m-0 pl-1"></label><br/><label class="acc-id m-0 pl-1"></label><span class="cloud-provider badge badge-secondary">AWS</span></a>`
    }

    if (options && typeof options === "object") {
      this.options = Utilities.extendDefaults(defaults, options);
    }
    if($(this.options.container).length){
      self.init();
    }    
  }
  async init() {
    let self = this;
    let accounts = await self.loadAccounts();
    await self.populateResources(accounts);
    self.initEvents();
    self.activateSelected();
    Utilities.hideLoader();
  }

  initEvents() {
    $(".account-option").on("click", function () {
      Utilities.setCurrentAccount($(this).data('accountId'));
      location.reload(true);
    });
  }

  activateSelected() {
    let currentAccount = Utilities.getCurrentAccount();    
    $(".account-option").removeClass("active")
    $(".account-option:contains('" + currentAccount + "')").addClass('active');
  }

  async loadAccounts() {
    let authToken = await Auth.authToken;
    let self = this;
    let response = await $.ajax({
      method: 'GET',
      url: _config.api2().cspAccounts,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json'
    });
    if (response.success) {
      return response.accounts;
    }
    return null;
  }

  async populateResources(accounts) {
    let self = this;
    for (let index in accounts) {
      let account = accounts[index];
      let $option = $(self.options.template);
      if(account.alias){
        $option.find('.alias').text(account.alias);
        $option.find('.acc-id').text(account.accountId);
      }else{
        $option.find('.acc-id').text(account.accountId);
        $option.find('.acc-id').addClass('account-selector-alias-id');
      }
      $option.data('accountId', account.accountId);      
      $(self.options.container).append($option);      
    }
  }
}