window.addEventListener ?
  window.addEventListener("load", contactFormInit, false) :
  window.attachEvent && window.attachEvent("onload", contactFormInit);

function getFormData($form){
  var unindexed_array = $form.serializeArray();
  var indexed_array = {};

  $.map(unindexed_array, function(n, i){
      indexed_array[n['name']] = n['value'];
  });

  return indexed_array;
}  

function contactFormInit() {
  $(document).ready(function () {
    $(".validate").jqBootstrapValidation({
      preventSubmit: true,
      submitError: function ($form, event, errors) {        
        Utilities.showAlert('Could not send contact us request :(, Please try again.');
      },
      submitSuccess: function ($form, event) {
        event.preventDefault();        
        var response = grecaptcha.getResponse();
        if (response.length == 0) {          
          Utilities.showAlert('Please complete captcha validation by checking captcha box below.', 'danger');
          return;
        }        
        Utilities.showLoader();
        $.ajax({
          method: 'POST',
          url: _config.api().contactUsSend,
          contentType: 'application/json',
          data: JSON.stringify(getFormData($form)),
          success: function (result) {
            $form[0].reset();
            grecaptcha.reset();
            Utilities.hideLoader();
            Utilities.showAlert("Thank you for contacting us. We will get back to you ASAP.");            
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
      }
    });
  });
}