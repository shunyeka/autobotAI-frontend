class UserProfile{
  constructor(){
    let self = this;
    Auth.authToken.then(function setAuthToken(token) {
      if (token) {
        self.authToken = token;
        Utilities.hideLoader();                
      }
    }).catch(function handleTokenError(error) {
      console.log(error);
    }); 
  }
}

$(function onDocReady() {    
  let userProfile = new UserProfile()
});
