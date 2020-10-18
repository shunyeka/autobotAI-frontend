var AWSSetup = window.AWSSetup || {};

(function scopeWrapper($) {
  $(function onDocReady() {
    Auth.authToken.then(function setAuthToken(token) {
      getSetupProgress(token);
    });
  });

  function updateSetupProgress(setupProgress) {
    Object.keys(setupProgress).forEach(function(key,index) {
      if(setupProgress[key] == true){
        $('.setup-step-list').find('a.'+key).removeClass('btn-danger').addClass('btn-success');
      }
    });
  }

  function getSetupProgress(authToken) {
    $.ajax({
      method: 'GET',
      url: _config.api().getSetupProgress,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        updateSetupProgress(JSON.parse(result));
        console.log("Hiding loader");
        Utilities.hideLoader();
        console.log(result);
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        $.notify({
          message: 'Unable to Access:' + jqXHR.responseText
        }, {
          type: 'danger'
        });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

}(jQuery));
