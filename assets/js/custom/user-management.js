
class UserManagement {
  constructor() {
    this.init();
  }

  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();    
    if(self.setupProgress){
      self.loadResources();
      self.initializeEvents();
    }else{
      Utilities.hideLoader();
    }   
  }

  initializeEvents() {
    var self = this
    var container = '.csp-accounts-container';
    $(container).on("change", "thead :checkbox", function () {
      if (this.checked) {
        $(container).find("tr:visible :checkbox").prop('checked', true);
      } else {
        $(container).find("tr:visible :checkbox").prop('checked', false);
      }
    })
    $('#user-submit').click(function () {
      $('#userCEForm').submit()
    })
    $('#show-create-user').click(function () {
      $('#user-modal').data('mode', 'Add')
      $('#userCEForm').empty()
      let data = {
        "id": "",
        "name": "",
        "phone": ""
      }
      $('#userCEForm').append(puglatizer['user-management']['user-form']({ "edit": false, "data": data }))
      self.cspAccountsTable = new CSPAccountsTable({
        container: '.csp-accounts-container',
        router: self.router,
        showActions: false
      })
      window.constants.COUNTRY_PHONE_CODES.forEach(function (countryCode) {
        $('#registerPhoneCode').append("<option value='" + countryCode.country_code + "'>" + countryCode.country_name + "</option>");
      })
      self.submitEvents();
      $('#user-modal').modal('show')
    })
  }

  submitEvents() {
    let self = this;
    $('.validate').jqBootstrapValidation("destroy")
    $('.validate').data('bootstrapValidator', null);
    $(".validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function ($form, event, errors) {
        console.log($form.prop('id'));
        console.log("Form validation failed");
      },
      submitSuccess: function ($form, event) {
        switch ($form.prop('id')) {
          case 'userCEForm':
            handleRegister(event, self);
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
  loadResources() {
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().userManagement,
      headers: {
        Authorization: self.router.token,
      },
      contentType: 'application/json',
      success: function (result) {

      },
      statusCode: {
        401: function () {          
          $.notify({
            message: 'You have not unauthorized to perform this action.'
          }, {
              type: 'danger'
            });
        }
      }
    }).done(function (result) {
      if (result.success == true) {
        self.populateResources(result.sub_users);
      } else if (result.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showLoader('We are analysing your infrastructure for security issues. Please check back after some time.');
      }
    }).fail(function () {
      Utilities.hideLoader();
    });
  }

  populateResources(data) {
    var self = this;
    let authToken = self.router.token;
    let itemTable = new ItemTablev2({
      container: ".table-container",
      searchableProperties: ["id", "name", "isActive", "createdAt"],
      primaryPropertiesInOrder: [
        { displayName: "ID", name: "id" },
        { displayName: "Name", name: "name" },
        { displayName: "Active", name: "isActive" },
        { displayName: "Created On", name: "createdAt" },
        { displayName: "Updated On", name: "updatedAt" },
      ],
      data: data,
      tableTemplate: puglatizer['user-management']['table-template'],
      rowTemplate: puglatizer['user-management']['table-row'],
      showCSVExport: false,
      searching: false,
      paging: false,
      info: false,
      actionStateCondition: {
        property: 'isActive',
        state: true
      },
      onAction: function (button, data) {
        if ($(button).hasClass('edit-btn')) {
          openEdit(self, data)
        }
      }
    });
    Utilities.hideLoader();
  }
}
async function openEdit(self, data) {
  $('#user-modal').data('mode', 'Edit')
  $('#userCEForm').empty()
  $('#userCEForm').append(puglatizer['user-management']['user-form']({ "edit": true, "data": data }))
  $('#gridCheck').prop('checked', data.readOnly)
  self.cspAccountsTable = new CSPAccountsTable({
    container: '.csp-accounts-container',
    router: self.router,
    showActions: false
  })
  while (!document.querySelector(".csp-table")) {
    await new Promise(r => setTimeout(r, 300));
  }
  if (data.permissions) {
    if (data.permissions.accounts) {
      data.permissions.accounts.forEach(value => {
        $('input[value=' + value + ']').prop('checked', true)
      })
    }
  }
  window.constants.COUNTRY_PHONE_CODES.forEach(function (countryCode) {
    $('#registerPhoneCode').append("<option value='" + countryCode.country_code + "'>" + countryCode.country_name + "</option>");
  })
  var countryCode = data.phone.slice(1, -10)
  if (data.hasOwnProperty("country")) {
    countryCode = data.country
  }
  $('#registerPhoneCode').val(countryCode);
  self.submitEvents();
  $('#user-modal').modal('show')
}

function handleRegister(event, self) {
  event.preventDefault();
  if ($("#registerPhoneCode").val() == "") {
    Utilities.showAlert("Please select your country", "danger");
    return;
  }
  Utilities.showLoader();
  var email = $("#registerEmail").val();
  var name = $("#registerName").val();
  var country = $("#registerPhoneCode").val()
  var phone = $("#registerPhone").val();
  var password = $("#registerPassword").val();
  var readOnly = $("#gridCheck").prop("checked");
  var selectedAccounts = self.cspAccountsTable.getselectedAccounts();
  var data = {
    "email": email,
    "name": name,
    "country": country,
    "phone": phone,
    "password": password,
    "readOnly": readOnly,
    "accounts": selectedAccounts
  }
  if ($('#user-modal').data('mode') == "Edit") {
    $.ajax({
      method: 'PUT',
      url: _config.api2().userManagement + '/' + email,
      headers: {
        Authorization: self.router.token,
      },
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function (result) {
        Utilities.hideLoader();
        if (result.success) {
          Utilities.showAlert('User updation successful.', 'success');
        } else if (result.error_code === "UsernameExistsException") {
          Utilities.showAlert("Something went wrong", 'danger');
        }
        $('#user-modal').modal('hide');
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        $('#user-modal').modal('hide');
        Utilities.showAlert('User updation failed:' + jqXHR.responseText, 'danger');
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    })
  } else {
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
        if (result.success) {
          Utilities.showAlert('User creation successful. The user will receive email for verification link.', 'success');
        } else if (result.error_code === "UsernameExistsException") {
          Utilities.showAlert("The email address you have entered is already registered", 'danger');
        }
        $('#user-modal').modal('hide');
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        Utilities.showAlert('User creation failed:' + jqXHR.responseText, 'danger');
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    })
  }
}



$(function onDocReady() {
  let userManagement = new UserManagement();
});
