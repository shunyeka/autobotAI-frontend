var Examples = window.Examples || {};

(function scopeWrapper($) {

var examplesArray = [
  ["Check your AWS Bill","https://www.youtube.com/embed/xR1uV0GhNrI","",""  ],
  ["","","You","Alexa, Open autobot"  ],
  ["","","Alexa","Thanks for waking me up, what do you want me to do in virginial region?"  ],
  ["","","You","Check if cloudwatch is configured properly?"  ],
  ["","","Alexa","xxxxxxxxxxxxxx"  ],
  ["","","You","Configure CloudWatch alarms as per the best practice."  ],
  ["","","Alexa","Ok, I have configured CPU, Memory, network and Volume alarms for EC2 and RDS."  ],
  ["","","You","Configure auto recovery for all ec2 instances"  ],
  ["","","Alexa","I have configured auto recovery for ec2 instances."  ],
  ["Check unused resources","https://www.youtube.com/embed/HU7SNnhUaI4","",""  ],
  ["","","You","Alexa, Open autobot"  ],
  ["","","Alexa","What do you want me to do in virginia region?"  ],
  ["","","You","My password is 5423"  ],
  ["","","Alexa","Great!! your password is correct, What do you want to me to do?"  ],
  ["","","You","Check for unsed resources"  ],
  ["","","Alexa","Please wait... I have unused resource xxxx"  ],
  ["Billing and Budget Management","https://www.youtube.com/embed/EvnvHhXDw48","",""  ],
  ["","","You","Alexa, Open autobot"  ],
  ["","","Alexa","I am connected to AWS account, what do you want me to do in Virginia region?"  ],
  ["","","You","What is my bill?"  ],
  ["","","Alexa","Seems like you have not set monthly budget yet. You can set the budget by saying set my monthly budget to to $xxx"  ],
  ["","","You","Set my monthly budget to $15000"  ],
  ["","","Alexa","I have set the AWS budget to $15000"  ],
  ["","","You","What is my bill?"  ],
  ["","","Alexa","Here's bill and RI details"  ],
  ["Check Security Compliance","https://www.youtube.com/embed/T-cWfbPtl-U","",""  ],
  ["","","You","Alexa, Open autobot"  ],
  ["","","Alexa","Autobot is activated, You have not set the default region."  ],
  ["","","You","Set the default region to Virginia"  ],
  ["","","Alexa","Ok, I have set the default region to Virginia"  ],
  ["","","You","Check security compliance"  ],
  ["","","Alexa","You did not set one time password. All autobotAI critical skill intent requires one time password for security hardening. One time password is sent to your alexa app feed."  ],
  ["","","You","Password is 3243"  ],
  ["","","Alexa","Great!! your password is correct, What do you want to me to do?"  ],
  ["","","You","Check security compliance"  ],
  ["","","Alexa","In my security analysis I have found...."  ]
];


function formatExamples(){
  var examplesWithCategory = [];
  var categoryObject = {};  
  examplesArray.forEach(function(item, index) {
    if(item[0] != ''){                           
      categoryObject = {'example': item[0].capitalize(), 'videoURL': item[1], 'conversation': []}
      if(index == 0){
        categoryObject.defaultOpen = 'in';
      }
      examplesWithCategory.push(categoryObject);      
    }
    if(item[2] != ''){
      categoryObject.conversation.push({speaker: item[2], text: item[3], class: item[2]==="You"?'sent':'replies', image: item[2]==="You"?'YouImage.png':'alexalogo.jpg'});
    }    
  })    
  return examplesWithCategory;
}

$(function onDocReady() {
  var examplesWithCategory = {'examples': formatExamples()};
  if (window.examplesTemplate == null) {
    var source = document.getElementById("examples-template").innerHTML;
    window.examplesTemplate = Handlebars.compile(source);
  }
  $('.example').html(window.examplesTemplate(examplesWithCategory));
});

}(jQuery));