class MyProfile {
  constructor() {
    this.init();
  }
  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();
    window.constants.COUNTRY_PHONE_CODES.forEach(function (countryCode) {
      $('#phone-code').append("<option value='" + countryCode.country_code + "'>" + countryCode.country_name + "</option>");
    });
    self.populateAttributes();
    let cspAccountsTable = new CSPAccountsTable({
      container: '.csp-accounts-container',
      router: self.router
    });
    Utilities.hideLoader();
    self.submitEvents();
  }

  async populateAttributes() {
    try {
      let self = this;
      var attributes = await Auth.retrieveAttributes()      
      var phone_number = null;
      var country_code = null;
      attributes.forEach(function (item) {
        if (item.Name == 'phone_number') {
          phone_number = item.Value
        }
        if (item.Name == 'custom:country') {
          country_code = item.Value
        }
      })
      if (country_code == null) {
        var startIndexCountry = 1
        var endIndexCountry = phone_number.length - 10
        $('#phone-code').val(phone_number.slice(startIndexCountry, endIndexCountry))
      }
      else{
        $('#phone-code').val(country_code)
      }
      $('#phone-number').val(phone_number.slice(phone_number.length - 10))   
    } catch (err) {
      Utilities.showAlert("Something went wrong : " + err, 'danger');
    }
  }
  submitEvents() {
    let self = this;
    $(".password-validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function () {
        Utilities.showAlert("Form validation failed", 'danger');
      },
      submitSuccess: async function ($form, event) {
        event.preventDefault();
        var btn = Ladda.create(document.querySelector('#password-submit'));
        btn.start();
        try {
          await Auth.changePassword($('#current-password').val(), $('#n-password').val())
          Utilities.showAlert("Password has been changed successfully", 'success');
        } catch (err) {
          Utilities.showAlert("Password change failed : " + err, 'danger');
        }
        btn.stop()
      },
      filter: function () {
        return $(this).is(":visible");
      }
    })


    $(".personal-validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function () {
        Utilities.showAlert("Form validation failed", 'danger');
      },
      submitSuccess: async function ($form, event) {
        event.preventDefault();
        var btn = Ladda.create(document.querySelector('#personal-submit'));
        btn.start();
        if ($('#phone-code').val() == '') {
          Utilities.showAlert("Please select your country", 'danger');
          btn.stop()
          return;
        }
        var attribute = {
          Name: 'phone_number',
          Value: '+' + $('#phone-code').val() + $('#phone-number').val()
        }
        var countryAttribute = {
          Name: 'custom:country',
          Value: $('#phone-code').val()
        }
        try {
          await Auth.updateAttributes(attribute)
          await Auth.updateAttributes(countryAttribute)
          Utilities.showAlert("Updated successfully", 'success');
          await self.populateAttributes()
        } catch (err) {
          Utilities.showAlert("Update failed : " + err, 'danger');
        }
        btn.stop()
      },
      filter: function () {
        return $(this).is(":visible");
      }
    })
  }
}

$(async function onDocReady() {
  let myProfile = new MyProfile()

});