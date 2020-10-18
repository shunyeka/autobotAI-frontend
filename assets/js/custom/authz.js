var AuthZ = window.AuthZ || {};

(function scopeWrapper($) {
  var signinUrl = '/o/auth.html?form=signin';  
  var authToken = null;    

  //private functions
  window.constants.COUNTRY_PHONE_CODES.forEach(function (countryCode) {
    $('#registerPhoneCode').append("<option value='" + countryCode.country_code + "'>" + countryCode.country_name + "</option>");
  });

  function initForms() {
    $(".validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function ($form, event, errors) {
        console.log($form.prop('id'));
        console.log("Form validation failed");
      },
      submitSuccess: function ($form, event) {
        switch ($form.prop('id')) {
          case 'loginForm':
            handleLogin(event);
            break;
          case 'registrationForm':
            handleRegister(event);
            break;
          case 'resendVerifyLink':
            handleResendVerification(event);
            break;
          case 'resetPasswordForm':
            handleForgotPassword(event);
            break;
          default:
            console.log("default");
        }
      },
      filter: function () {
        return $(this).is(":visible");
      }
    })
    Utilities.hideLoader();
  }

  $(function onDocReady() {
    if (Utilities.getUrlParameter("form") != undefined && Utilities.getUrlParameter("form") != "") {
      showForm(Utilities.getUrlParameter("form"));
    }
    if (Utilities.getUrlParameter("authToken") != undefined && Utilities.getUrlParameter("authToken") != "") {
      window.accountLinking = true;
    }
    initForms();    
    Auth.authToken.then(function setAuthToken(token) {
      if (token) {
        enableLogout();
        if (window.accountLinking) {          
            generateToken(token);          
        } else {          
          authToken = token;          
          Utilities.showLoader();
          new Router().init().then(function(setupProgress){
            Router.handleLoginSuccessRouting(setupProgress);
            Utilities.hideLoader();
          });
        }
      }else{
        throw Error
      }
    }).catch(function handleTokenError(error) {      
      Utilities.cleanupStorage();
      Utilities.hideLoader();            
      if (window.location.pathname != "/" && window.location.pathname.indexOf('auth.html') < 0 && window.location.pathname.indexOf('index.html')) {
        Utilities.navigateToPage(signinUrl);        
      }
    });     
  });

  function enableLogout(){
    $('#logout').closest('.nav-item').show();          
    $('#logout').click(function signOut() {
      Auth.signOut();
    });
  }
  //User Action Handlers  

  function handleLogin(event) {
    event.preventDefault();
    Utilities.showLoader();
    var email = $('#loginEmail').val();
    var password = $('#loginPassword').val();

    Auth.login(email, password,
      function loginSuccess(result) {        
        if (window.accountLinking) {
          generateToken(result.getIdToken().getJwtToken());
        } else {                              
          new Router({"token": result.getIdToken().getJwtToken()}).init().then(function(setupProgress){
            if(setupProgress){
              Router.handleLoginSuccessRouting(setupProgress);
            }                        
          });
        }
      },
      function loginError(err) {
        if (err.code == "UserNotConfirmedException") {
          showForm('verify');
          Utilities.showAlert('You have not verified your email yet. Please check email inbox for verification link to complete verfication.', 'danger');
        } else if (err.code == "UserNotFoundException") {
          Utilities.showAlert("Couldn't file your autobotAI account", 'danger');          
        } else if (err.code == 'NotAuthorizedException') {
          Utilities.showAlert("Invalid Username or Password", 'danger');
        } else {
          Utilities.showAlert('Signin Failed: ' + err, 'danger')
        }
        Utilities.hideLoader();
      }
    );
  }

  function handleForgotPassword(event) {
    event.preventDefault();
    Utilities.showLoader();
    if ($('#resetEmail').val() == '' && $('#resetPassword').val() == '') {
      console.log('forgot password invalid');
      return;
    }
    var email = $('#resetEmail').val();
    if (email != '') {
      window.resetPasswordEmail = email;
      $('#resetEmail').val('');
      Auth.forgotPassword(email, function forgotPasswordSuccess(result) {
        $('.verify-init').hide();
        $('.verify-final').show();
        $('.forgot-pwd-htm .button').prop('value', "Reset Password");
        Utilities.hideLoader();
      },
        function forgotPasswordError(err) {
          $.notify({
            message: 'Reset Password request Failed: ' + err
          }, {
              type: 'danger'
            });
          Utilities.hideLoader();
        });
    } else {
      var verificationCode = $('#resetVerificationCode').val();
      var resetPassword = $('#resetPassword').val();
      Auth.confirmPassword(window.resetPasswordEmail, verificationCode, resetPassword, function resetPasswordSuccess(result) {
        $('.verify-init').show();
        $('.verify-final').hide();
        $('.forgot-pwd-htm .button').prop('value', "Send Verification Code");
        window.resetPasswordEmail = null;
        $.notify({
          message: 'Password Reset successfully'
        }, {
            type: 'success'
          });
        showForm('');
        Utilities.hideLoader();
      },
        function resetPasswordError(err) {
          $.notify({
            message: 'Reset Password request Failed: ' + err
          }, {
              type: 'danger'
            });
          Utilities.hideLoader();
        })
    }
  }

  function handleResendVerification(event) {
    event.preventDefault();
    var email = $('#verificationEmail').val();
    Utilities.showLoader();
    Auth.resendVerificationCode(email, function success(result) {
      showForm('login');
      Utilities.showAlert('Please check your email inbox or spam folder for your verification link', 'success');
      Utilities.hideLoader();      
    }, function failure(err) {
      if (err.code == 'UserNotFoundException') {
        Utilities.showAlert('Couldn\'t file your autobotAI account', 'danger');
      } else if (err.code == 'LimitExceededException' || err.code == 'TooManyRequestsException') {
        Utilities.showAlert('You have exceeded resend code limit. Please try after some time.', 'danger');
      } else {
        Utilities.showAlert('Resend Verification Code Failed ' + err, 'danger');
      }
      Utilities.hideLoader();
    });
  }

  function generateToken(authToken) {
    $.ajax({
      method: 'GET',
      url: _config.api().authCallback + "?authToken=" + Utilities.getUrlParameter('authToken'),
      headers: {
        Authorization: authToken
      },
      contentType: 'application/json',
      success: function (result) {
        Auth.signOut();
        location.href = result.redirectURL;
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
        alert('An error occured when creating user in DynamoDB:\n' + jqXHR.responseText);
      }
    });
  }

  function showForm(formName) {
    switch (formName) {
      case 'register':
        $('#sign-up-tab').prop('checked', 'checked');
        break;
      case 'resendVerify':
        $('#verify-tab').prop('checked', 'checked');
        break;
      case 'resetPassword':
        $('#forgot-pwd-tab').prop('checked', 'checked');
        break;
      default:
        $('#sign-in-tab').prop('checked', 'checked');
    }
    resetForms();
  }

  function resetForms(){
    document.getElementById('loginForm').reset();
    document.getElementById('registrationForm').reset();
    document.getElementById('resendVerifyLink').reset();
    document.getElementById('resetPasswordForm').reset();
  }

  function handleRegister(event) {
    event.preventDefault();
    if ($('#registerPhoneCode').val() == '') {
      Utilities.showAlert("Please select your country", 'danger');
      return;
    }
    Utilities.showLoader();
    var userName = $('#registerName').val();
    var email = $('#registerEmail').val();
    var phone = "+" + $('#registerPhoneCode').val() + $('#registerPhone').val();
    var password = $('#registerPassword').val();
    var country=$('#registerPhoneCode').val();
    var onSuccess = function registerSuccess(result) {
      showForm('login');
      Utilities.hideLoader();
      Utilities.showAlert('Registration successful. Please check your email inbox or spam folder for verification link.', 'success');      
    };
    var onFailure = function registerFailure(err) {
      if (err.code == 'UsernameExistsException') {
        Utilities.showAlert("The email address you have entered is already registered", 'danger');
      } else {
        Utilities.showAlert("Registration failed:" + err, 'danger');
      }
      Utilities.hideLoader();
    };
    event.preventDefault();
    Auth.register(email, password, phone, userName, country, onSuccess, onFailure);
  }

}(jQuery));
