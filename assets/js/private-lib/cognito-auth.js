/*global autobotAI _config AmazonCognitoIdentity AWSCognito*/
var Auth = window.Auth || {};

(function scopeWrapper($) {
  var signinUrl = '/o/auth.html?form=signin';
  var dashboard = '/i/dashboard.html';
  var authToken = null;

  var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
  };

  var userPool;

  if (!(_config.cognito.userPoolId &&
      _config.cognito.userPoolClientId &&
      _config.cognito.region)) {
    $('#noCognitoMessage').show();
    return;
  }

  userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  if (typeof AWSCognito !== 'undefined') {
    AWSCognito.config.region = _config.cognito.region;
  }

  Auth.signOut = function signOut(doRedirect = true) {
    userPool.getCurrentUser().signOut();
    if (doRedirect != undefined && doRedirect == true) {
      Utilities.navigateToPage(signinUrl);
    }
  };

  Auth.getUsername = function getUsername() {
    return userPool.getCurrentUser().getUsername();
  };

  Auth.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
    var cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.getSession(function sessionCallback(err, session) {
        if (err) {
          reject(err);
        } else if (!session.isValid()) {
          resolve(null);
        } else {
          resolve(session.getIdToken().getJwtToken());
        }
      });
    } else {
      resolve(null);
    }
  });

  /*
   * Cognito User Pool functions
   */

  Auth.register = function register(email, password, phone, name, country, onSuccess, onFailure) {
    var dataEmail = {
      Name: 'email',
      Value: email
    };
    var dataPhoneNumber = {
      Name: 'phone_number',
      Value: phone
    };
    var dataName = {
      Name: 'given_name',
      Value: name
    };
    var dataCountry = {
      Name: 'custom:country',
      Value: country
    };
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhoneNumber);
    var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
    var attributeCountry = new AmazonCognitoIdentity.CognitoUserAttribute(dataCountry);


    userPool.signUp(email, password, [attributeEmail, attributePhoneNumber, attributeName, attributeCountry], null,
      function signUpCallback(err, result) {
        if (!err) {
          onSuccess(result);
        } else {
          onFailure(err);
        }
      }
    );
  }

  Auth.forgotPassword = function forgotPassword(email, onSuccess, onFailure) {
    createCognitoUser(email).forgotPassword({
      onSuccess: onSuccess,
      onFailure: onFailure
    });
  }

  Auth.confirmPassword = function confirmPassword(email, verificationCode, newPassword, onSuccess, onFailure) {
    createCognitoUser(email).confirmPassword(verificationCode, newPassword, {
      onSuccess: onSuccess,
      onFailure: onFailure
    });
  }

  Auth.resendVerificationCode = function resendVerificationCode(email, onSuccess, onFailure) {
    createCognitoUser(email).resendConfirmationCode(function (err, result) {
      if (err) {
        onFailure(err);
      }
      onSuccess(result);
    });
  }

  Auth.login = function login(email, password, onSuccess, onFailure) {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: email,
      Password: password
    });

    var cognitoUser = createCognitoUser(email);
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: onSuccess,
      onFailure: onFailure
    });
  }

  Auth.retrieveAttributes = function getAttributes() {
    return new Promise(function retrieve(resolve, reject) {
      var cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession(function sessionCallback(err, session) {
          if (err) {
            reject(err)
          } else if (!session.isValid()) {
            reject(err);
          } else {
            cognitoUser.getUserAttributes(function (err, result) {
              if (err) {
                reject(err);
              }
              resolve(result)
            });
          }
        });
      }
    })
  }



  Auth.changePassword = function changePassword(oldPassword, newPassword) {
    return new Promise(function updatePassword(resolve, reject) {
      var cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession(function sessionCallback(err, session) {
          if (err) {
            reject(err);
          } else if (!session.isValid()) {
            reject(err);
          } else {
            cognitoUser.changePassword(oldPassword, newPassword, function (err, result) {
              if (err) {
                reject(err);
              }
              console.log('call result: ' + result);
              resolve(true)
            });
          }
        });
      }
    })
  }





  Auth.updateAttributes = function updateAttributes(attributes) {
    return new Promise(function update(resolve, reject) {
      var cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession(function sessionCallback(err, session) {
          if (err) {
            reject(err);
          } else if (!session.isValid()) {
            reject(err);
          } else {
            var attributeList = [];
            var attribute = new AmazonCognitoIdentity.CognitoUserAttribute(attributes);
            attributeList.push(attribute);

            cognitoUser.updateAttributes(attributeList, function (err, result) {
              if (err) {
                reject(err);
              }
              console.log('call result: ' + result);
              resolve(true)
            });
          }
        });
      }
    })
  }

  Auth.verify = function verify(email, code, onSuccess, onFailure) {
    createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
      if (!err) {
        onSuccess(result);
      } else {
        onFailure(err);
      }
    });
  }

  function createCognitoUser(email) {
    return new AmazonCognitoIdentity.CognitoUser({
      Username: email,
      Pool: userPool
    });
  }
}(jQuery));