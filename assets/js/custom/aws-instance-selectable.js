class AWSInstancesSelectable{
  constructor(options){
    let self = this;
    Utilities.showLoader();
    var defaults = {
      container: '.container',
      data: null
    }
    
    if (options && typeof options === "object") {
        this.options = this.extendDefaults(defaults, options);
    }
    this.tableTemplateHTML = `      
      <table class="table table-bordered resource-table">
        <thead>
        <tr>
          <th><input type="checkbox" class='all' /></th>
          {{#each primaryPropertiesInOrder}}
            <th>{{this.displayName}}</th>
          {{/each}}        
        </tr>
        </thead>
        <tbody class="resource-table-body">
            
        </tbody>
      </table>`
    this.rowTemplateHTML = `    
      <tr>
          <td><input type="checkbox" value="{{value}}"/></td>
          {{#each row}}
          <td class="searchable">{{this}}</td>
          {{/each}}      
      </tr>`
    
    self.init();
  }
  init(){
    let self = this;
    self.loadTemplate();
    self.populateResources();        
  }

  loadTemplate() {
    window.itemTableTemplate = Handlebars.compile(this.tableTemplateHTML);
    window.itemTableRowTemplate = Handlebars.compile(this.rowTemplateHTML);
  }  
  getSelectedInstances(onlyId=true){
    return this.itemTable.getSelected(onlyId);
  }  
  populateResources(){              
    let self = this;
    self.itemTable = new ItemTable({
      container: self.options.container,
      searchableProperties: ['name', 'region', 'tags', 'vpcId'], 
      primaryPropertiesInOrder: [
        {displayName: 'ID', name: 'id'},  
        {displayName: 'State', name: 'state'},  
        {displayName: 'VPC ID', name: 'vpcId'},         
        {displayName: 'Tags', name: 'tags', mergeKeyValues: true}],
      data: self.options.data,
      rowTemplateId: 'ssm-instances-table-template',
      tableTemplateId: 'ssm-instances-row-template',
      checkboxValueProperty: 'id',
      // showCSVExport: false
    })    
    Utilities.hideLoader();    
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