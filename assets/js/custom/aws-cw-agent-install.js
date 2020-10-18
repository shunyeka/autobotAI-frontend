class AWSCWAgentInstall {
  constructor(options) {
    console.log('Aws CW Agent Instal called');
    var defaults = {
      container: $('.container'),      
    }
    if (options) {
      this.options = this.extendDefaults(defaults, options);
    }
    let self = this;    
    Auth.authToken.then(function setAuthToken(token) {
      if (token) {
        self.authToken = token;
        self.init()
      }
    }).catch(function handleTokenError(error) {
      console.log(error);
    });
  }
  init() {
    this.loadResources()    
  }
  
  loadResources() {    
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().instances+'?filters='+encodeURIComponent('{"ssm": true}'),
      headers: {
        Authorization: self.authToken,
      },
      contentType: 'application/json',
      success: function (result) {        
        Utilities.hideLoader();        
        if(result.success == true && result.resource_list != null){
          self.populateResources(result.resource_list);
        }else if(result.error_code == 'AWS_DATA_NOT_FOUND'){
          
        }else{
          Utilities.showAlert("No SSM enabled instances found.", 'success');
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

  populateResources(data){
    let self = this
    let container = '.instance-selector-container'
    let awsInstanceSelectable = new AWSInstancesSelectable({
      container: container,
      data: data
    });
    $(container).append('<button class="btn btn-primary tk-action">Install CloudWatch Agent</button>');
    $(container).on('click', '.tk-action', function (params) {      
      Utilities.showLoader('Installing CloudWatch Agent on the selected instances...');
      self.installAgent(awsInstanceSelectable.getSelectedInstances());
    });
  }

  installAgent(instances){
    let self = this;
    $.ajax({
      method: 'PUT',
      url: _config.api2().instances,
      contentType: 'application/json',
      headers: {
        Authorization: self.authToken,
      },
      data: JSON.stringify({'instanceIds': instances}),
      success: function (result) {
        Utilities.hideLoader();
        if(result.success == true){          
          $.notify({
            message: 'CloudWatch Agent to monitor memory/disk/network/cpu has been installed on the selected instances.'
          }, {
              type: 'success',
              delay: 0,
          });                  
        }else{
          $.notify({
            message: 'Could not install CloudWatch Agent on the instances. Please try again.'
          }, {
            type: 'danger',
            delay: 0,
          });
        }
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        $.notify({
          message: 'CloudWatch Agent install failed: ' + jqXHR.responseText
        }, {
          type: 'danger'
        });        
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  // Utility method to extend defaults with user options
  extendDefaults(source, properties) {
    var property;
    for (property in properties) {
      if (properties.hasOwnProperty(property)) {
        source[property] = properties[property];
      }
    }
    return source;
  }
}