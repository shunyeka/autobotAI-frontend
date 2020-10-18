class AWSOptimizationReport {
  constructor(options) {
    console.log('AWSOptimizationReport constructor called');
    var defaults = {
      container: $('.tk-container'),      
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
    this.addGenerateButton();
  }
  
  addGenerateButton(){
    let self = this;
    $(self.options.container).append('<button class="btn btn-primary tk-action">Generate Report</button>');
    $(self.options.container).on('click', ' .tk-action', function (params) {      
      Utilities.showLoader('Generating AWS Optimization Report');
      self.loadResources()         
    });
    Utilities.hideLoader();
  }

  loadResources() {    
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().generateOptimizationReport,
      headers: {
        Authorization: self.authToken,
      },
      contentType: 'application/json',
      success: function (result) {      
        Utilities.hideLoader();
        if(result.success == true){
          self.populateResources(result);
        }else if(result.error_code == 'NO_PREMIUM_SUBSCRIPTION'){
          Utilities.showAlert('This AWS account does not have premium support enabled. This features requires premium support.', 'danger');
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
    let $iframe = $('<iframe name="print_frame" style="height:1000px;width:100%;" src="about:blank"></iframe>');
    $(self.options.container).html($iframe);
    $(self.options.container).find('iframe').contents().find('html').html($(data.reportHtml));    
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