class CSPAccountsTable {
  constructor(options) {
    let self = this;
    Utilities.showLoader(null, 'CSPAccountsTable.constructor');
    var defaults = {
      container: '.container',
      router: null,
      showActions: true
    }

    if (options && typeof options === "object") {
      this.options = Utilities.extendDefaults(defaults, options);
    }
    this.tableTemplateHTML = `      
      <table class="table  csp-table table-striped table-bordered resource-table m-0 bg-white">
        <thead>
        <tr>
          {{#each primaryPropertiesInOrder}}
            <th>{{this.displayName}}</th>
          {{/each}}        
          <th>Action</th>
        </tr>        
        </thead>
        <tbody class="resource-table-body">
            
        </tbody>
      </table>`
    this.tableTemplateHTMLWithoutActions = `      
      <table class="table csp-table table-striped table-bordered resource-table m-0 bg-white">
        <thead>
        <tr>
          <th><input type="checkbox" class="all"/></th>          
          {{#each primaryPropertiesInOrder}}
            <th>{{this.displayName}}</th>
          {{/each}}        
        </tr>        
        </thead>
        <tbody class="resource-table-body">
            
        </tbody>
      </table>`
    this.rowTemplateHTML = `    
      <tr>
          {{#each row}}
          <td class="searchable">{{this}}</td>
          {{/each}}
          <td><a class="action btn btn-success btn-disable">Disable</a><a class="action btn btn-success btn-set-default" style="margin-left:10px;">Set Default</a><a class="action btn btn-success btn-edit" style="margin-left:10px;">Edit</a></td>                    
      </tr>`
    this.rowTemplateHTMLWithoutActions = `    
      <tr>
          <td><input type="checkbox" value="{{value}}"/></td>          
          {{#each row}}
          <td class="searchable">{{this}}</td>
          {{/each}}
      </tr>`
    this.otherDetailsModal = `<div id="other-details-popup" class="modal fade" role="dialog">
    <div class="modal-dialog">    
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title">More Details</h4>
        </div>
        <div class="modal-body">
          
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>  
    </div>
  </div>`
    if ($('#other-details-popup').length == 0) {
      $("body").append(this.otherDetailsModal);
    }
    self.init();
  }
  init() {
    let self = this;
    self.loadTemplates();
    self.fetchData(self.options.router.token, function (data) {
      self.populateResources(data);
    })
  }

  loadTemplates() {
    if(!this.options.showActions){
      window.itemTableTemplate = Handlebars.compile(this.tableTemplateHTMLWithoutActions);
      window.itemTableRowTemplate = Handlebars.compile(this.rowTemplateHTMLWithoutActions);
    } else {
      window.itemTableTemplate = Handlebars.compile(this.tableTemplateHTML);
      window.itemTableRowTemplate = Handlebars.compile(this.rowTemplateHTML); 
    }
  }

  updateDefaultAccount(accountId) {
    let self = this;
    let preferences = {
      defaultAccount: accountId
    }
    $.ajax({
      method: 'PATCH',
      url: _config.api2().userPreferences,
      headers: {
        Authorization: self.options.router.token,
      },
      data: JSON.stringify(preferences),
      contentType: 'application/json',
      success: function (result) {
        if (result.success) {
          Utilities.showAlert('Updated default account', 'success');
        }
        Utilities.hideLoader();
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        console.log('fetchData Error');
        console.log(errorThrown);
        Utilities.showAlert('Unable to set account as default', 'danger');
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        Utilities.hideLoader();
      }
    });
  }

  populateResources(data) {
    let self = this;
    Utilities.hideLoader('CSPAccountTable.fetchData.populateResources');
    $('.csp-accounts-container').empty()
    console.log(self.options.container)
    self.itemTable = new ItemTable({
      container: self.options.container,
      searchableProperties: ['accountId', 'alias', 'cspName', 'isActive'],
      primaryPropertiesInOrder: [
        { displayName: 'ID', name: 'accountId' },
        { displayName: 'Name', name: 'alias' },
        { displayName: 'Provider', name: 'cspName' },
        { displayName: 'Default Region', name: 'defaultRegion' },
        { displayName: 'Active', name: 'isActive' },
        { displayName: 'Last Analysed', name: 'lastIndexedAt' }],
      data: data,
      checkboxValueProperty: 'accountId',
      showCSVExport: false,
      searching:false,
      paging:false,
      info:false,
      actionStateCondition: {
        property : 'isActive',
        state: true
      }, 
      onAction: function (target, rowData) {
        if ($(target).hasClass('btn-set-default')) {
          Utilities.showLoader();
          self.updateDefaultAccount(rowData.accountId);
        } else {
          if ($(target).hasClass('btn-edit')) {
            bootbox.prompt({ 
              size:"small",
              title: "Enter new alias name",
              value:rowData['alias'],
              callback: function(alias){
                if(alias == ''){
                  Utilities.showAlert('Please provide valid alias name', 'danger');
                  return;
                }
                if(alias == null){
                  return;
                }
                self.updateSelectedAccount(self.options.router.token, rowData, alias);
              }
            });
          }
          //Add code to disable account here
        }
      }
    })
  }

  fetchData(authToken, callback) {
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().cspAccounts,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        console.log('fetchData Result');
        console.log(result);
        callback(result.accounts);
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        console.log('fetchData Error');
        console.log(errorThrown);
        window.Router.handleOtherPageRouting(authToken, true);
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        Utilities.hideLoader();
      }
    });
  }

  getselectedAccounts() {
    let self = this;
    return self.itemTable.getSelected();
  }

  updateSelectedAccount(authToken, rowData, alias){
    if(authToken == null || rowData == null || alias == null || alias == ''){
      return;
    }
    Utilities.showLoader();
    $.ajax({
      method: 'PUT',
      url:_config.api2().cspAccounts+"/"+rowData.accountId,
      headers: {
        Authorization: authToken,
      },
      data:JSON.stringify({'alias':alias}),
      contentType:'application/json',
      success:function(result){
        $('.csp-accounts-container').find('td').each(function(){
          if($(this).text()==rowData.accountId){
            $(this).parent().find('td:nth-child(2)').text(alias);
          }
        });
        $('.alias').each(function(){
          if($(this).text()===rowData['alias']){
            $(this).text(alias);
          }else if($(this).siblings('.acc-id').text()==rowData['accountId']){
            $(this).text(alias);
            $(this).siblings('.acc-id').addClass('alias-id');
            $(this).siblings('.acc-id').text(rowData['accountId']);
          }
        });
        rowData.alias = alias;
        Utilities.hideLoader();
        Utilities.showAlert('Alias name successfully set', 'success');
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.showAlert('Unable to set alias for the account', 'danger');
        console.error('Response: ', jqXHR.responseText);
        Utilities.hideLoader();
      }
    });
  }
}