class Integrations {
    constructor(options) {    
      var defaults = {        
      }
      if (options) {
        this.options = Utilities.extendDefaults(defaults, options);
      }    
      let self = this;
      Auth.authToken.then(function setAuthToken(token) {
        if (token) {
          if(Utilities.getStorageItem('userType') !== "SUBUSER"){
            self.authToken = token;
            self.init()
          }        
        }
      }).catch(function handleTokenError(error) {
        console.log(error);      
      });
    }
  
    async init() {
        Utilities.hideLoader();
    }
}

$(function onDocReady() {
    let integrations = new Integrations({});
  });