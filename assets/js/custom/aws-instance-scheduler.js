var timezone = "";
var DEFAULT_FORMAT = "HH:MM";

var WeekDays = [
  {
    name: "Monday",
    value: "mon",
    type: "weekday"
  },
  {
    name: "Tuesday",
    value: "tue",
    type: "weekday"
  },
  {
    name: "Wednesday",
    value: "wed",
    type: "weekday"
  },
  {
    name: "Thusday",
    value: "thu",
    type: "weekday"
  },
  {
    name: "Friday",
    value: "fri",
    type: "weekday"
  },
  {
    name: "Saturday",
    value: "sat",
    type: "weekend"
  },
  {
    name: "Sunday",
    value: "sun",
    type: "weekend"
  }
]

class AWSInstanceScheduler {
  constructor(options) {
    this.init()
  }
  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();
    let schedules = await self.loadSchedules()
    if (schedules) {
      await self.populateSchedules(schedules)
    }
    Utilities.hideLoader();
    self.renderDayCheckboxes();
    self.setUserTimezone();
    self.initEvents();
    let instances = await self.loadResources()
    self.populateResources(instances);
    $('.buttons-csv.buttons-html5').hide();

  }

  toggleControlBtn(btn) {
    if ($(btn).find('.fa-list').length == 0) {
      $(btn).text('  List').prepend('<i class="fa fa-list"></i>');
    } else {
      $(btn).text('  Create').prepend('<i class="fa fa-plus"></i>');
    }
  }

  async initEvents() {
    let self = this;
    $("#instance_scheduler_form").submit(async function (event) {
      event.preventDefault();
      var btn = Ladda.create(document.querySelector('#schedule-submit'));
      btn.start();
      var result = self.validations();
      if (result == true) {
        await self.createSchedule();
        btn.stop();
      }
    });
    $('.bnt-view-toggle').click(function () {
      self.toggleControlBtn(this)
    })
    $('.time-selector-control').on('change', function () {
      $(this).closest('.form-group').find('.form-control').prop('disabled', !$(this).prop("checked"));
    })
    $('#days').change(function () {
      if ($('#days').val() == 'week days') {
        $('.day-check.weekday').prop('checked', true);
        $(".day-check.weekend").prop('checked', false);
      }
      else if ($('#days').val() == 'weekend') {
        $('.day-check.weekday').prop('checked', false);
        $(".day-check.weekend").prop('checked', true);
      }
      else if ($('#days').val() == 'every day') {
        $(".day-check").prop('checked', true);
      }
    });
  }

  async loadSchedules() {
    let self = this;
    try {
      let response = await $.ajax({
        method: 'GET',
        url: _config.api2().instanceSchedules,
        headers: {
          Authorization: self.router.token,
        },
        contentType: 'application/json'
      });
      if (response.success == true) {
        return response.schedules;
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      }
    } catch (error) {
      Utilities.hideLoader();
      Utilities.showAlertNoAws();
      console.error('Error requesting ride: ', ', Details: ', error);
    }
  }

  async populateSchedules(schedules) {
    let self = this;
    self.itemTable = new ItemTablev2({
      container: "#schedules_table",
      searchableProperties: ['schedule_name', 'description', 'timezone'],
      primaryPropertiesInOrder: [
        { displayName: 'Name', name: 'schedule_name' },
        { displayName: 'Start Time', name: 'begintime' },
        { displayName: 'Stop Time', name: 'endtime' }],
      data: schedules,
      tableTemplate: puglatizer["aws-instance-scheduler"]["list-table"],
      rowTemplate: puglatizer["aws-instance-scheduler"]['list-row'],
      showMoreTemplate: puglatizer["aws-instance-scheduler"]['show-more'],
      checkboxValueProperty: 'schedule_id',
      onAction: async function (button, data) {
        if ($(button).hasClass('btn-delete')) {
          var btn = Ladda.create(button);
          btn.start();
          await self.deleteSchedule(data.schedule_id)
          btn.stop();
          $(button).closest('tr').remove();
        }
      }
    })
  }

  async createSchedule() {
    let self = this;
    this.gettimezone();
    var json = this.createJson();
    try {
      let response = await $.ajax({
        method: 'POST',
        url: _config.api2().instanceSchedules,
        headers: {
          Authorization: self.router.token,
        },
        contentType: 'application/json',
        data: JSON.stringify(json),
      });
      if (response.success == true) {
        Utilities.showAlert('Schedule created successfully.')
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      }
      $('.bnt-view-toggle').click()
    } catch (error) {
      Utilities.hideLoader();
      Utilities.showAlertNoAws();
      console.error('Error requesting ride: ', ', Details: ', error);
    }
  }

  async deleteSchedule(scheduleId) {
    let self = this;
    try {
      let response = await $.ajax({
        method: 'DELETE',
        url: _config.api2().instanceSchedules+"/"+scheduleId,
        headers: {
          Authorization: self.router.token,
        },
        contentType: 'application/json'
      });
      if (response.success == true) {
        return response.resource_list;
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      }
    } catch (error) {
      Utilities.hideLoader();      
      console.error('Error requesting ride: ', ', Details: ', error);
    }
  }

  async loadResources() {
    let self = this;
    try {
      let response = await $.ajax({
        method: 'GET',
        url: _config.api2().instances,
        headers: {
          Authorization: self.router.token,
        },
        contentType: 'application/json'
      });
      if (response.success == true) {
        return response.resource_list;
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      }
    } catch (error) {
      Utilities.hideLoader();
      Utilities.showAlertNoAws();
      console.error('Error requesting ride: ', ', Details: ', error);
    }
  }

  populateResources(data) {
    let self = this
    let container = '.instance-selector-container'
    self.awsInstanceSelectable = new AWSInstancesSelectable({
      container: container,
      data: data
    });
  }

  renderDayCheckboxes() {
    $.each(WeekDays, function (index, value) {
      $('#checkbox').append(`
            <div class="d-flex">
                <label class="switch switch-label switch-outline-success-alt">
                        <input class="switch-input day-check `+ WeekDays[index].type + `" name="` + WeekDays[index].value + `" type="checkbox">
                                <span class="switch-slider" data-checked="On" data-unchecked="Off"></span>
                </label>
                <label class="col">`+ WeekDays[index].name + `</label>
            </div>`)
    });
    $('.day-check.weekday').prop('checked', true);
    $(".day-check.weekend").prop('checked', false);
  }
  getSelectedInstances() {
    let instances_data = this.awsInstanceSelectable.getSelectedInstances(false)
    let regional_instances = {}
    for (const instance_data of instances_data) {
      if (!regional_instances.hasOwnProperty(instance_data.region)) {
        regional_instances[instance_data.region] = []
      }
      regional_instances[instance_data.region].push(instance_data.id)
    }
    return regional_instances;
  }
  createJson() {
    var jsonResult = {
      begintime: "",
      endtime: "",
      instances: this.getSelectedInstances(),
      weekdays: [],
      schedule_name: "",
      description: "",
      timezone: ""

    }
    var BT = document.getElementById("begintime").value;
    jsonResult.begintime = BT;
    var ET = document.getElementById("endtime").value;
    jsonResult.endtime = ET;
    jsonResult.timezone = timezone;
    jsonResult.weekdays = this.setDays();
    var schedule_name = document.getElementById("schedule_name").value;
    jsonResult.schedule_name = schedule_name;
    var description = document.getElementById("description").value;
    jsonResult.description = description;
    return jsonResult;
  }
  validations() {
    if ($('.time-selector-control:checked').length == 0) {
      $('#errormessage.text-danger.d-none').removeClass("d-none");
      $('#errormessage.text-danger').empty().append('Please select either Start Time or Stop Time.');
      return false;
    } else if ($('.time-selector-control:checked').length == 2) {
      var BT = document.getElementById("begintime").value;
      var ET = document.getElementById("endtime").value;
      if (BT >= ET) {
        $('#timeerrormessage.text-danger.d-none').removeClass("d-none");
        $('#timeerrormessage.text-danger').empty().append('Start Time cannot be ahead of Stop Time');
        return false;
      }
    }
    if (this.awsInstanceSelectable.getSelectedInstances(false).length == 0) {
      Utilities.showAlert("Please select at least one instance for scheduling", 'danger');
      return false;
    }
    return true;
  }
  setDays() {
    let selectedWeekDays = []
    $('.day-check:checked').each(function () {
      selectedWeekDays.push($(this).prop('name'));
    })
    return selectedWeekDays
  }
  setUserTimezone() {
    var m = (new Date).toString().split('(')[1].slice(0, -1);
    $('#timezone,.timezone').append(`<p>&nbsp&nbsp&nbsp&nbsp Timezone : ` + m + `</p>`);
  }
  gettimezone() {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

$(document).ready(function () {
  let awsInstanceScheduler = new AWSInstanceScheduler();
});