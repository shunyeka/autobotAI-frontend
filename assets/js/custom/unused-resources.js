class UnusedResources {
  constructor() {
    this.init();
  }
  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();
    self.loadResources(self.router.token);
  }

  loadResources(authToken) {
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().unusedResources,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        if (result.success == true) {
          self.populateResources(result.resource_list, authToken);
        } else if (result.error_code == 'AWS_DATA_NOT_FOUND') {
          Utilities.showLoader('We are analysing your infrastructure for unused resources. Please check back after some time.');
        }else if(result.error_code == "UNAUTHORIZED") {
          Utilities.handleUnauthorized();
        }
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        $.notify({
          message: 'Unable to fetch resources'
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  populateResources(data, authToken) {
    let itemTable = new ItemTable({
      container: '.table-container',
      searchableProperties: ['name', 'region', 'tags', 'vpcId'],
      primaryPropertiesInOrder: [
        { displayName: 'Type', name: 'type' },
        { displayName: 'ID', name: 'id' },
        { displayName: 'Name', name: 'name' },
        { displayName: 'Region', name: 'region' },
        { displayName: 'Tags', name: 'tags', mergeKeyValues: true }],
      data: data,
      onAction: function (target, rowData) {
        let resourceDetail = 'ID: ' + rowData.id + ' Name: ' + rowData.name
        if (!rowData.alertMessage) {
          bootbox.alert('autobotAI is not able fix the issue. You will need to fix the issue manually by going to AWS Console.');
          return;
        }
        bootbox.confirm(rowData.alertMessage + ' ' + resourceDetail, 
        function (result) {
          if(!result){return;}
          Utilities.showLoader();    
          $.ajax({
            method: 'POST',
            url: _config.api2().unusedResourceFix,
            contentType: 'application/json',
            headers: {
              Authorization: authToken,
            },
            data: JSON.stringify(rowData),
            success: function (result) {
              if (result != null && result.success) {
                itemTable.markFixed(target)
              }
              Utilities.hideLoader();
            },
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
              Utilities.hideLoader();
              $.notify({
                message: 'Contact Failed: ' + jqXHR.responseText
              }, {
                type: 'danger'
              });
              console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
              console.error('Response: ', jqXHR.responseText);
            }
          });
        });
      }
    })
    Utilities.hideLoader();
  }
}

$(document).ready(function(){
  let unusedResources = new UnusedResources();  
});