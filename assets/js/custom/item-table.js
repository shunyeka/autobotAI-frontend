class ItemTable {
  constructor(options) {
    var defaults = {
      container: '',
      searchableProperties: [],
      keyValueProperties: [],
      primaryPropertiesInOrder: [],
      checkboxValueProperty: null,
      tableTemplateId: 'item-table-template',
      rowTemplateId: 'item-table-row-template',
      showCSVExport: true,
      data: null,
      actionStateCondition: null,
      searching:true,
      paging:true,
      info:true,
      detailsFormatHandler: null
    }

    if (options && typeof options === "object") {
      this.options = this.extendDefaults(defaults, options);
    }
    this.init()
  }

  init() {
    let finalValueArray = this.fetchFromRowData.call(this)
    this.populateTable(finalValueArray);
    this.initializeEvents()
  }

  getSelected(onlyId = true) {
    let self = this;
    let result = []
    self.dtable.rows().nodes().to$().find('input[type="checkbox"]:checked:not(.all)').each(function () {
      if (onlyId) {
        result.push($(this).val());
      } else {
        result.push($(this).closest('tr').data('rowData'));
      }
    })
    return result;
  }

  markFixed(target) {
    $(target).text('Done');
    $(target).addClass('disabled');
  }

  initializeEvents() {
    let self = this    
    $(this.options.container).on('click', '.show-more', function () {
      var jsonObj = $(this).closest('tr').data('otherDetails');
      var options = {
        formatProperty: function (prop) {
          var strong = document.createElement('strong');
          strong.appendChild(prop);
          strong.appendChild(document.createTextNode(': '));

          return strong;
        },
        formatValue: function (value, prop) {
          var elm;
          if (prop === 'propPre') {
            elm = document.createElement('pre');
          } else {
            elm = document.createElement('span');
          }
          elm.appendChild(value);

          return elm;
        }
      };      
      var moreDetailTreeHTML = JSON2HTMLList(jsonObj, options);
      $('#other-details-popup').find('.modal-body').html(moreDetailTreeHTML);  
      $('.modal-body').treed();
      $('#other-details-popup').modal('show');
    });
    if (self.options.onAction != null && $.isFunction(self.options.onAction)) {
      $(self.options.container).on('click', '.action', function () {
        self.options.onAction(this, $(this).closest('tr').data('rowData'))
      });
    }
    if(this.options.detailsFormatHandler != null){
      $(this.options.container).on('click', '.details-control', function () {
        var tr = $(this).closest('tr');
        var row = self.dtable.row( tr );
  
        if ( row.child.isShown() ) {            
            row.child.hide();
            tr.removeClass('shown');
        }
        else {            
            row.child( self.options.detailsFormatHandler($(this).closest('tr').data('rowData'))).show();
            tr.addClass('shown');
        }
    } );
    }    
    $(this.options.container).on('click', 'input[type=checkbox].all', function () {
      if ($(this).is(':checked')) {
        $(self.options.container).find('input[type=checkbox]').prop('checked', true);
      } else {
        $(self.options.container).find('input[type=checkbox]:not(.all)').prop('checked', false);
      }
    });    
  }

  fetchFromRowData() {
    let finalValueArray = this.options.data.map(item => {
      let row = {
        rowData: item,
        otherDetails: [],
        values: [],
        value: ''
      }
      this.options.primaryPropertiesInOrder.map(property => {
        if (item.hasOwnProperty(property.name) && item[property.name] != null) {
          if (property.hasOwnProperty('mergeKeyValues') && property.mergeKeyValues) {
            let mergedValues = item[property.name].map(kw => {
              var b = []; Object.keys(kw).forEach(function (k) { b.push(k + ":" + kw[k]); });
              b = b.join('\n');
              return b
            })
            row.values.push(mergedValues.join("\n"))
          } else {
            let value = item[property.name]
            if(value!=null){
              if (typeof value === "boolean"){
                value = value ? 'Yes' : 'No'
              }
            }
            row.values.push(value)
          }
        } else {
          row.values.push("NA")
        }
      })
      Object.keys(item).forEach(key => {
        let isPrimary = this.options.primaryPropertiesInOrder.find(property => property.name == key)
        if (isPrimary == null) {
          let otherDetail = {}
          otherDetail[key] = item[key]
          row.otherDetails.push(otherDetail)
        }
        if (this.options.checkboxValueProperty && this.options.checkboxValueProperty == key) {
          row.value = item[key]
        }
      })
      return row
    })
    return finalValueArray
  }

  populateTable(finalValueArray) {
    var self = this;
    //TODO: This limits to have only 1 item table per page. This should use the passed templates
    if (window.itemTableTemplate == null) {
      var source = document.getElementById(self.options.tableTemplateId).innerHTML;
      window.itemTableTemplate = Handlebars.compile(source);
    }
    //TODO: This limits to have only 1 item table per page. This should use the passed templates
    if (window.itemTableRowTemplate == null) {
      var source = document.getElementById(self.options.rowTemplateId).innerHTML;
      window.itemTableRowTemplate = Handlebars.compile(source);
    }

    let $table = $(window.itemTableTemplate({ primaryPropertiesInOrder: self.options.primaryPropertiesInOrder }));
    for (var i = 0; i < finalValueArray.length; i++) {
      let row = finalValueArray[i];
      let $row = $(window.itemTableRowTemplate({ row: row.values, otherDetails: row.otherDetails, value: row.value }));
      $row.data('rowData', row.rowData);
      $row.data('otherDetails', row.otherDetails);
      if (self.options.actionStateCondition) {        
        if (row.rowData[self.options.actionStateCondition.property] == self.options.actionStateCondition.state) {
          $row.find('.action').removeClass('disabled');
        } else {
          $row.find('.action').addClass('disabled');
        }
      }
      $table.find('.resource-table-body').append($row);
    }
    $(this.options.container).append($table);
    if (this.options.showCSVExport) {
      self.dtable = $(this.options.container).find('table').DataTable(
        {
          dom: 'lfrtipB',
          buttons: [
            {
              extend: 'csv',
              text: 'Export to CSV',
              columns: ':not(:nth-last-child(2)):not(:nth-last-child(1))'
            },
          ],
          initComplete: function () {
            $('.buttons-html5').addClass('btn btn-primary');
          }
        }
      )
    } else {
      self.dtable = $(this.options.container).find('table').DataTable({
        dom: 'lfrti'
        , initComplete: function () {
          $('.buttons-html5').addClass('btn-primary');
        },
        searching: this.options.searching, paging: this.options.paging, info: this.options.info
      })
    }
  }
  
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