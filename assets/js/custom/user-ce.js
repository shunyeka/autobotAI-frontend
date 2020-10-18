class UserCE {
  constructor() {
    this.init();
  }

  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();
    window.constants.COUNTRY_PHONE_CODES.forEach(function(countryCode) {
      $("#registerPhoneCode").append(
        "<option value='" +
          countryCode.country_code +
          "'>" +
          countryCode.country_name +
          "</option>"
      );
    });
    self.cspAccountsTable = new CSPAccountsTable({
      container: ".csp-accounts-container",
      router: self.router,
      showActions: false
    });
    self.initializeEvents();    
    self.submitEvents();
    Utilities.hideLoader();
  }

  initializeEvents() {
    var container = ".csp-accounts-container";
    $(container).on("change", "thead :checkbox", function() {
      if (this.checked) {
        $(container)
          .find("tr:visible :checkbox")
          .prop("checked", true);
      } else {
        $(container)
          .find("tr:visible :checkbox")
          .prop("checked", false);
      }
    });
  }

  submitEvents() {
    let self = this;
    $(".validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function($form, event, errors) {
        console.log($form.prop("id"));
        console.log("Form validation failed");
      },
      submitSuccess: function() {
        event.preventDefault();
        if ($("#registerPhoneCode").val() == "") {
          Utilities.showAlert("Please select your country", "danger");
          return;
        }
        Utilities.showLoader();
        var email = $("#registerEmail").val();
        var name = $("#registerName").val();
        var phone =
          "+" + $("#registerPhoneCode").val() + $("#registerPhone").val();
        var password = $("#registerPassword").val();
        var readOnly = $("#readOnlyCheck").prop("checked");
        var selectedAccounts = self.cspAccountsTable.getselectedAccounts();
        var data = {
          "email": email,
          "name": name,
          "phone": phone,
          "password": password,
          "readOnly": readOnly,
          "accounts": selectedAccounts
        }
        $.ajax({
          method: 'POST',
          url: _config.api2().userManagement,
          headers: {
            Authorization: self.router.token,
          },
          contentType: 'application/json',
          data: JSON.stringify(data),
          success: function (result) {            
            Utilities.hideLoader();
            if(result.success){
              Utilities.showAlert('User creation successful. The user will review email for verification link.', 'success');
              Utilities.navigateToPage('user-management.html')
            }else if(result.error_code === "UsernameExistsException"){
              Utilities.showAlert("The email address you have entered is already registered", 'danger');
            }            
          },
          error: function ajaxError(jqXHR, textStatus, errorThrown) {
            Utilities.hideLoader();
            Utilities.showAlert('User creation failed:' + jqXHR.responseText, 'danger');            
            console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
            console.error('Response: ', jqXHR.responseText);
          }
        });
      },
      filter: function() {
        return $(this).is(":visible");
      }
    });
    Utilities.hideLoader();
  }
}

$(async function onDocReady() {
  let userCE = new UserCE();
});
