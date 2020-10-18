class BudgetService {
  constructor(options) {
    var defaults = {      
      router: null      
    }
    if (options && typeof options === "object") {
      this.options = Utilities.extendDefaults(defaults, options);
    }
    this.init();
  }
  async init() {
    let self = this;
    $('body').on('click', 'button.budget-modal', async function () {
      Utilities.showLoader()
      await self.populateBudgetTable();
      Utilities.hideLoader()      
    });    
    $('body').on('click', 'button.set-budget', function () {
      Utilities.showLoader()
      self.postData();
    });
  }
  async populateBudgetTable() {
    let self = this;
    try {
      let response = await $.ajax({
        method: 'GET',
        url: _config.api2().budgetManagement,
        headers: {
          Authorization: self.options.router.token,
        },
        contentType: 'application/json'
      });      
      if (response.success == true) {
        self.budget = response;
        $("body").remove('#budgetModel').append(puglatizer["budget-setup"]['aws-budget-template']({
          'budgets': self.budget.budgets,
          "currency": function (amount) {
            if (amount) {
              return '$' + Math.round(amount)
            } else {
              return "NA"
            }
          }
        }));
        $('#budgetModel').modal('show');
      } else if (response.error_code == 'AWS_DATA_NOT_FOUND') {
        Utilities.showAlertNoAws();
      }           
    } catch (e) {
      console.log(e);
    }
  }
  budgetDataHelper(budget) {
    var bData = {
      "budget_amount": 0,
      "is_set": budget.is_set
    }
    var $input = $("input." + budget.name)
    if (budget.budget_amount != $input.val()) {
      bData.budget_amount = Math.round($input.val());
    }
    return bData;
  }
  postData() {
    let self = this;
    var budgets = self.budget.budgets;
    var postData = {};
    Object.keys(budgets).forEach(function (property, index) {
      postData[budgets[property].name] = self.budgetDataHelper(budgets[property])
    });        
    $.ajax({
      url: _config.api2().budgetManagement,
      type: "POST",
      headers: {
        Authorization: self.options.router.token,
      },
      data: JSON.stringify(postData),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function () {
        $('#budgetModel').modal('hide');
        location.reload();
        Utilities.hideLoader();
      }
    })
  }
}