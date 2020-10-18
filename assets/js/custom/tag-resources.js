class TagResources{
  constructor() {
    this.environments = [{
      'name': 'production',
      'label': 'Production'
    }, {
      'name': 'staging',
      'label': 'Staging'
    }, {
      'name': 'perf',
      'label': 'Perf'
    }, {
      'name': 'qa',
      'label': 'QA'
    }, {
      'name': 'development',
      'label': 'Development'
    }];
    this.init();    
  }
  async init() {
    let self = this;
    self.router = new Router();
    self.setupProgress = await self.router.init();    
    self.loadResources();
  }

  loadResources() {
    let self = this;
    $.ajax({
      method: 'GET',
      url: _config.api().listResources,
      headers: {
        Authorization: self.router.token,
      },
      contentType: 'application/json',
      success: function (result) {
        self.populateResources(result);
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        Utilities.showAlertNoAws();
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }

  populateResources(resourceData) {
    let self = this;
    var instanceResourceTable = new ResourceTable({
      container: '#ec2',
      resourceArray: resourceData.instances,
      environments: self.environments
    });
    var rdsResourceTable = new ResourceTable({
      container: '#rds',
      resourceArray: resourceData.databases,
      environments: self.environments
    });
    var s3ResourceTable = new ResourceTable({
      container: '#s3',
      resourceArray: resourceData.s3Buckets,
      environments: self.environments
    });
    var cloudFrontResourceTable = new ResourceTable({
      container: '#cloudFronts',
      resourceArray: resourceData.cloudFronts,
      environments: self.environments
    });
    var elasticCacheResourceTable = new ResourceTable({
      container: '#elasticCaches',
      resourceArray: resourceData.cacheClusters,
      environments: self.environments
    });
    Utilities.hideLoader();
    $('.save-tagged-resources').click(function () {
      Utilities.showLoader();
      var taggedResources = {};
      if (instanceResourceTable != null) {
        taggedResources.instances = instanceResourceTable.getTaggedResources();
      }
      if (rdsResourceTable != null) {
        taggedResources.databases = rdsResourceTable.getTaggedResources();
      }
      if (s3ResourceTable != null) {
        taggedResources.s3Buckets = s3ResourceTable.getTaggedResources();
      }
      if (cloudFrontResourceTable != null) {
        taggedResources.cloudFronts = cloudFrontResourceTable.getTaggedResources();
      }
      if (elasticCacheResourceTable != null) {
        taggedResources.cacheClusters = elasticCacheResourceTable.getTaggedResources();
      }      
      self.tagResources(taggedResources);      
    });
  }

  tagResources(taggedResources) {
    let self = this;
    $.ajax({
      method: 'POST',
      url: _config.api().tagResources,
      headers: {
        Authorization: self.router.token,
      },
      data: JSON.stringify(taggedResources),
      contentType: 'application/json',
      success: function (result) {
        Utilities.hideLoader();
        $.notify({
          message: 'Resources Tagged Successfully'
        }, {
            type: 'success'
          });
        console.log(result);
      },
      error: function ajaxError(jqXHR, textStatus, errorThrown) {
        Utilities.hideLoader();
        $.notify({
          message: 'Unable tag Resources:' + jqXHR.responseText
        }, {
            type: 'danger'
          });
        console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
        console.error('Response: ', jqXHR.responseText);
      }
    });
  }
}

$(document).ready(function(){
  let tagResources = new TagResources();  
});