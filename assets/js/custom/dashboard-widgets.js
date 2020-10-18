window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

window.securityColors = ['rgb(255,0,0)', 'rgb(255,165,0)', 'rgb(255,255,0)', 'rgb(0,128,0)']

window.colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

class DWidgets {
  constructor() {
    this.init();
  }
  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();
    window.budget = new BudgetService({ router: self.router });
    Utilities.hideLoader();
    Chart.plugins.register({
      afterDraw: function (chart) {
        if (chart.data.noDataFillText) {
          var ctx = chart.chart.ctx;
          var width = chart.chart.width;
          var height = chart.chart.height
          chart.clear();
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = "16px bold 'Helvetica Nueue'";
          ctx.fillText(chart.data.noDataFillText, width / 2, height / 2);
          ctx.restore();
        }
      }
    });
    let data = await self.fetchDashboardData(self.router.token)
    if (data) {
      self.populateWidgets(data.resourceOptimizationSummary);
      self.populateUnusedResources(data.unusedResources);
      self.populateSecurityIssues(data.securityIssues);
      self.populateMaintenanceTasks(data.maintenance);
    }
  }

  async fetchDashboardData(authToken) {
    try {
      let response = await $.ajax({
        method: 'GET',
        url: _config.api2().insights,
        headers: {
          Authorization: authToken,
        },
        contentType: 'application/json',
      });
      if (response.success == true) {
        return response.data;
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      } else if(response.error_code == "UNAUTHORIZED") {
        Utilities.handleUnauthorized();
      }
    } catch (error) {
      Utilities.hideLoader();
      Utilities.showAlertNoAws();
      console.error('Error requesting ride: ', ', Details: ', error);
    }
  }

  async populateWidgets(resourceOptimizationSummary) {
    var self = this;
    $('.ri-info').find('.spinner').show();
    $('.cost-overview').find('.spinner').show();
    try {
      const result = await $.ajax({
        method: 'GET',
        url: _config.api2().costInsights,
        headers: {
          Authorization: self.router.token,
        },
        contentType: 'application/json',
      });
      if (result.success) {
        if (window.costOverviewWidget == null) {
          var source = document.getElementById("cost-overview-widget-template").innerHTML;
          window.costOverviewWidget = Handlebars.compile(source);
        }
        if (window.riInfoWidget == null) {
          var source = document.getElementById("ri-info-widget-template").innerHTML;
          window.riInfoWidget = Handlebars.compile(source);
        }
        Handlebars.registerHelper('contextualClass', function (percent, timeLapsed) {
          if (percent > 100) {
            return 'danger'
          } else if (timeLapsed != null && percent > timeLapsed) {
            return 'warning'
          } else {
            return 'success'
          }
        });
        Handlebars.registerHelper("roundOff", function (value) {
          if (value) {
            return Math.round(value)
          } else {
            return 0;
          }
        });
        Handlebars.registerHelper('contextualInvertedClass', function (percent, timeLapsed) {
          if (percent == 100) {
            return 'success'
          } else if (percent < 75) {
            return 'danger'
          } else {
            return 'warning'
          }
        });        
        $('.cost-overview').find('.spinner').hide();
        $('.cost-overview > :not(.spinner)').remove();
        $('.cost-overview').append(window.costOverviewWidget(result.data));
        $('.ri-info').find('.spinner').hide();
        $('.ri-info > :not(.spinner)').remove();
        $('.ri-info').empty().append(window.riInfoWidget(result.data));
        $('.ri-info').append(puglatizer["dashboard"]["compute-optimizer"]({
          "data": resourceOptimizationSummary, "hasResources": resourceOptimizationSummary ? true : false
        }));
      } else {        
        if (result.error_code == 'AccessDeniedException') {
          $(document).on('click', '.ce-access', function(){
            bootbox.alert(`<h3>Enable cost explorer in your AWS account.</h3>
            <h4>To sign up for Cost Explorer</h4>
            <ul>
              <li>Sign in to the AWS Management Console and open the Billing and Cost Management console at https://console.aws.amazon.com/billing/home#/.</li>
              <li>On the navigation pane, choose Cost Explorer.</li>
              <li>On the Welcome to Cost Explorer page, choose Enable Cost Explorer.</li>
            </ul>
            <a href='https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-enable.html'>AWS User Guide</a>`);
          });
          $('.cost-overview').find('.spinner').hide();
          $('.cost-overview > :not(.spinner)').remove();
          $('.cost-overview').append("Unable to access data. Please <a class='ce-access' href='javascript:void()' >enable cost explorer</a> in your AWS account");
          $('.ri-info').find('.spinner').hide();
          $('.ri-info > :not(.spinner)').remove();
          $('.ri-info').empty().append("Unable to access data. Please <a class='ce-access' href='javascript:void()' >enable cost explorer</a> in your AWS account");
        }
      }
    } catch (error) {
      Utilities.hideLoader();
      $.notify({
        message: 'Unable to Access:' + jqXHR.responseText
      }, {
        type: 'danger'
      });
      console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
      console.error('Response: ', jqXHR.responseText);
    }
  }

  populateMaintenanceTasks(data) {
    var maintenanceTasks = document.getElementById('maintenanceTasks').getContext('2d');
    var maintenanceTasksChart = new Chart(maintenanceTasks, {
      type: 'horizontalBar',
      maintainAspectRatio: false,
      options: {
        responsive: true,
        legend: {
          position: 'top',
        },
        title: {
          display: false,
          text: 'Maintenance Tasks'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
      data: this.getMaintenanceTasksDataset(data)
    })
    $('.maintenance-tasks-chart').find('.spinner').hide();
  }

  getMaintenanceTasksDataset(data) {
    var labels = [];
    var chartData = [];
    var unusedChartColors = [];
    var hasData = false;
    Object.keys(data).forEach((key, index) => {
      if (data[key].count > 0) {
        labels.push(data[key].label)
        chartData.push(data[key].count)
        if (data[key].count) {
          hasData = true
        }
        unusedChartColors.push(window.securityColors[data[key].severity - 1])
      }
    })
    let dataset = {
      datasets: [{
        data: chartData,
        backgroundColor: unusedChartColors,
        label: 'Maintenance Tasks'
      }],
      labels: labels,
      noDataFillText: hasData ? undefined : 'Yaay! No maintenance tasks found'
    }
    return dataset;
  }

  populateSecurityIssues(data) {
    var securityIssues = document.getElementById('securityIssues').getContext('2d');
    var securityIssuesChart = new Chart(securityIssues, {
      type: 'pie',
      maintainAspectRatio: false,
      options: {
        responsive: true,
        legend: {
          position: 'top',
          labels: {
            fontSize: 8,
            padding: 3,
            boxWidth: 15
          }
        },
        title: {
          display: false,
          text: 'Security Issues'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
      data: this.getSecurityIssuesDataset(data)
    })
    $('.security-issue-chart').find('.spinner').hide();
  }

  populateUnusedResources(data) {
    var unusedResources = document.getElementById('unusedResources').getContext('2d');
    var unusedResourcesChart = new Chart(unusedResources, {
      type: 'doughnut',
      maintainAspectRatio: false,
      options: {
        responsive: true,
        legend: {
          position: 'top',
        },
        title: {
          display: false,
          text: 'Unused Resources'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
      data: this.getUnusedResourceDataset(data)
    })
    $('.unused-resources-chart').find('.spinner').hide();
  }

  getSecurityIssuesDataset(data) {
    var labels = [];
    var chartData = [];
    var unusedChartColors = []
    var hasData = false;
    Object.keys(data).forEach((key, index) => {
      if (data[key].count > 0) {
        labels.push(data[key].label)
        chartData.push(data[key].count)
        if (data[key].count) {
          hasData = true
        }
        unusedChartColors.push(window.securityColors[data[key].severity - 1])
      }
    })
    let dataset = {
      datasets: [{
        data: chartData,
        backgroundColor: unusedChartColors,
        label: 'Security Issues'
      }],
      labels: labels,
      noDataFillText: hasData ? undefined : 'Yaay! No security issues found'
    }
    return dataset;
  }

  getUnusedResourceDataset(data) {
    var labels = [];
    var chartData = [];
    var unusedChartColors = []
    var hasData = false;
    Object.keys(data).forEach((key, index) => {
      if (data[key].unused > 0) {
        labels.push(data[key].label)
        if (data[key].unused) {
          hasData = true
        }
        chartData.push(data[key].unused)
        unusedChartColors.push(window.colorArray[index])
      }
    })

    let dataset = {
      datasets: [{
        data: chartData,
        backgroundColor: unusedChartColors,
        label: 'Unused Resources'
      }],
      labels: labels,
      noDataFillText: hasData ? undefined : 'Yaay! No unused resource found'
    }
    return dataset;
  }
}

$(document).ready(function () {
  window.widgets = new DWidgets();
});