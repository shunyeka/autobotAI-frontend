window.apiPathMapping = {
  stage: {
    stage_name: '${stage_name}',
    domain: '${domain}',
    api: '${api_url}',
    api2: '${api2_url}',
    userPoolId: '${cognito_user_pool_id}',
    userPoolClientId: '${cognito_user_pool_client_id}',
    scheme: '${scheme}',
    webroot: '${webroot}',
    launchStackTemplateUrl: '${launch_stack_template_url}'
  }
}

function getApiMapping() {
  return window.apiPathMapping.stage  
}

function getScheme() {
  return getApiMapping().scheme
}

function getWebRoot() {
  return getApiMapping().webroot
}

function getApiPath() {
  return getApiMapping().api;
}

function getApi2Path() {
  return getApiMapping().api2;
}

function getUserPoolId() {
  return getApiMapping().userPoolId;
}

function getRPayKey() {
  return getApiMapping().rpayKey;
}

function getUserPoolClientId() {
  return getApiMapping().userPoolClientId;
}

function getLaunchStackTemplateUrl() {
  return getApiMapping().launchStackTemplateUrl;
}

function getAPIv1() {
  return getScheme() + getApi2Path() + '/api/v1'
}

function getAWSAPIv1() {
  return getAPIv1() + '/aws'
}

function awsAccountsAPIv1() {
  return getAWSAPIv1() + '/' + Utilities.getCurrentAccount()
}

window._config = {
  cognito: {
    userPoolId: getUserPoolId(),
    userPoolClientId: getUserPoolClientId(),
    region: 'us-east-1' // e.g. us-east-2
  },
  api: () => {
    return {
      //users: getScheme() + getApiPath() + '/users',
      //verifyAccess: getScheme() + getApiPath() + "/cloudServiceProvider/checkAccess",
      listResources: getScheme() + getApiPath() + "/listResources/" + Utilities.getCurrentAccount(),
      tagResources: getScheme() + getApiPath() + '/tagResources/' + Utilities.getCurrentAccount(),
      //getSetupProgress: getScheme() + getApiPath() + '/getSetupProgress',
      authCallback: getScheme() + getApiPath() + '/auth/callback',
      contactUsSend: getScheme() + getApiPath() + '/contactus/send'
    }
  },
  api2: () => {
    return {
      unusedResources: awsAccountsAPIv1() + '/insights/unusedResources',
      unusedResourceFix: awsAccountsAPIv1() + '/fixes/unusedResources',
      maintenanceTasks: awsAccountsAPIv1() + '/insights/maintenanceTasks',
      maintenanceTaskFix: awsAccountsAPIv1() + '/fixes/maintenanceTasks',
      securityIssues: awsAccountsAPIv1() + '/insights/securityIssues',
      securityIssueFix: awsAccountsAPIv1() + '/fixes/securityIssues',
      costInsights: awsAccountsAPIv1() + '/insights/cost',
      insights: awsAccountsAPIv1() + '/insights',
      awsRegionPreference: awsAccountsAPIv1() + '/preferences/regions',
      generateOptimizationReport: awsAccountsAPIv1() + '/reports/optimization',
      instances: awsAccountsAPIv1() + '/instances',
      fetchData: awsAccountsAPIv1() + '/baseline/fetchSchedule',
      instanceSchedules: awsAccountsAPIv1() + '/instanceSchedules',
      budgetManagement: awsAccountsAPIv1() + '/budgets',
      accountSetupInit: getAPIv1() + '/accountSetup',
      userPreferences: getAPIv1() + '/users/preferences',
      cspAccounts: getAPIv1() + '/users/accounts',
      userManagement: getAPIv1() + '/subusers',
      userDetails: getAPIv1() + '/users/me'
    }
  },
  templates: {
    path: getWebRoot(),
    pug_path: getWebRoot() + "templates/"
  },
  validations: {
    iamArmRegEx: /arn:aws:iam::\d{12}:role?[a-zA-Z_0-9+=,.@\\-_\/]+/
  },
  assets_path: {
    js: getWebRoot() + "assets/js/"
  },
  accountSetup: {
    launchStackTemplateUrl: getLaunchStackTemplateUrl()
  },
  pages: {
    dashboard: '/i/dashboard.html',
    tagResources: '/i/tag-resources.html',
    signIn: '/o/auth.html?form=signin',
  },
  pageGroups: {
    integrations: {
      "group": '/i/integrations/',
      "index": '/i/integrations/index.html'
    }
  }
};
