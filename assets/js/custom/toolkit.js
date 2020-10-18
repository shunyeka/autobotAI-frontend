class Toolkit{
  constructor(options){
    let self = this;    
    var defaults = {
      container: '',     
    }
    
    if (options && typeof options === "object") {
        this.options = this.extendDefaults(defaults, options);
    }
    self.activePlugins = [];
    self.init();    
  }

  initPlugin(name){
    let self = this;
    if(!self.activePlugins[name]){          
      Utilities.showLoader();  
      let plugin = null;
      switch (name) {
        case 'generate_optimization_reprot':                
          plugin = new AWSOptimizationReport({
            container: '#generate_optimization_reprot .tk-container'
          });          
          break;
        case 'install_cw_agent':
          plugin = new AWSCWAgentInstall();
          break;
        default:
          break;
      }
      if(plugin){
        self.activePlugins[name] = plugin;
      }      
    }    
  }

  init(){
    let self = this;
    $('li.nav-item.nav-dropdown.toolkit > ul > li > a').click(function(){            
      var i, tabcontent, tablinks;
      console.log($(this).data('target'));
      self.initPlugin($(this).data('target'));
      tabcontent = document.getElementsByClassName("toolkit-content");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      tablinks = document.getElementsByClassName("toolkit-content");
      $('.nav-link').removeClass('active');
      $('#'+$(this).data('target')).show();      
      $(this).addClass('active');
    });        
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