class AWSRegionSelectModal {
  constructor(options) {
    Utilities.showLoader(null, 'AWSRegionSelectModal.constructor');
    var defaults = {
      force: false,
      auto: false,
      edit: false,
      target: null,
      successCallback: null
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
      Utilities.hideLoader('AWSRegionSelectModal.constructor.authToken.error');
    });
  }
  init() {
    this.loadResources(this.authToken);
  }
  loadResources(authToken) {
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api2().awsRegionPreference,
      headers: {
        Authorization: authToken,
      },
      contentType: 'application/json',
      success: function (result) {
        if (result.success == false) {          
          Utilities.hideLoader();
        } else {          
          self.currentPref = result.regionPreferences
          self.showPopup();
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

  showPopup() {
    let self = this;
    if (self.hasOwnProperty('currentPref')) {
      if (self.options.auto) {
        if (self.currentPref.defaultRegion == null ||
          self.currentPref.activeRegions == null || self.currentPref.activeRegions.length == 0 || self.options.edit) {
          self.loadPopup(() => {
            console.log('showing Popup');
            let regionPrefModal = $('body').find('#modalRegionSelect')[0];
            if (regionPrefModal == null) {
              let finalHtml = window.awsRegionPreferenceTemplate({
                currentPref: self.currentPref,
                force: self.options.force
              });
              regionPrefModal = $(finalHtml);
              regionPrefModal.on('click', '#saveRegionPref', function () {
                self.saveRegionPref(regionPrefModal)
              });
              $('body').append(regionPrefModal);
            }
            if (self.currentPref.defaultRegion) {
              regionPrefModal.find('#defaultRegion').val(self.currentPref.defaultRegion.name);
              regionPrefModal.find('input[type=checkbox][value=' + self.currentPref.defaultRegion.name + ']').prop("checked", true);
            }
            for (let i in self.currentPref.activeRegions) {
              regionPrefModal.find('input[type=checkbox][value=' + self.currentPref.activeRegions[i].name + ']').prop("checked", true);
            }
            regionPrefModal.modal("show");
            Utilities.hideLoader('showPopup.loadPopup');
          })
        }
      }
    }
  }

  saveRegionPref(regionPrefModal) {
    let self = this;
    Utilities.showLoader(null, 'saveRegionPref');
    let defaultRegionSelected = regionPrefModal.find('#defaultRegion').val();
    let activeRegionsSelected = regionPrefModal.find('input:checkbox:checked').map((index, item) => $(item).val()).get();
    if ((self.currentPref.defaultRegion != null && self.currentPref.defaultRegion.name == defaultRegionSelected) && !self.hasActiveRegionsChanged(activeRegionsSelected)) {
      Utilities.hideLoader('saveRegionPref.noChange');
      return
    } else {
      $.ajax({
        method: 'POST',
        url: _config.api2().awsRegionPreference,
        contentType: 'application/json',
        headers: {
          Authorization: self.authToken,
        },
        data: JSON.stringify({ defaultRegion: defaultRegionSelected, activeRegions: activeRegionsSelected }),
        success: function (result) {
          regionPrefModal.modal("hide");
          Utilities.hideLoader('saveRegionPref.ajax.success');
          $.notify({
            message: 'AWS Region preference saved successfully'
          }, {
              type: 'success'
            });
          if (self.options.successCallback) {
            self.options.successCallback(self.authToken)
          }
        },
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
          Utilities.hideLoader('saveRegionPref.ajax.error');
          $.notify({
            message: 'Save Region Preference Failed: ' + jqXHR.responseText
          }, {
              type: 'danger'
            });
          regionPrefModal.modal("hide");
          console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
          console.error('Response: ', jqXHR.responseText);
        }
      });
    }
  }

  hasActiveRegionsChanged(activeRegionsSelected) {
    let self = this;
    var currentSelectedRegionArray = [];
    for (let activeregion in self.currentPref.activeRegions) {
      currentSelectedRegionArray.push(activeregion.name);
    }
    return !($(activeRegionsSelected).not(currentSelectedRegionArray).length === 0 && $(currentSelectedRegionArray).not(activeRegionsSelected).length === 0);
  }

  loadPopup(callback) {
    let self = this;
    console.log('loadPopup');
    if (window.awsRegionPreferenceTemplate === undefined) {
      var url = _config.templates.path + $('#awsRegionPref').attr('src')
      if(url.startsWith('//')){
        url = url.slice(1)
      }      
      $.ajax({
        method: 'GET',
        url: url,
        dataType: 'text',
        success: function (result) {
          let templateFunction = eval("(function(){return " + result + "}());");
          window.awsRegionPreferenceTemplate = Handlebars.template(templateFunction);
          callback()
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log(jqXHR)          
          Utilities.hideLoader('loadPopup.ajax.error');
        }
      });

    }else {
      callback()
    }
    
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