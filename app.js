
'use strict';

process.env.DEBUG = 'actions-on-google:*';
let Assistant = require('actions-on-google').ApiAiAssistant;
let express = require('express');
let bodyParser = require('body-parser');

let request = require('request');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

// API.AI actions
const WELCOME_ACTION = 'input.welcome';

app.get('/', function (req, res) {
  res.send('Hello world from the webhook.');
})

function industryIdLookup(industry_display_name) {
  let industries = {
    'Biopharma': 1,
    'Tech': 2,
    'Construction': 3,
    'Education': 4,
    'Food': 5,
    'HR': 6,
    'Healthcare': 7,
    'Marketing': 8,
    'Retail': 9,
    'Supply Chain': 10,
    'Electric Utility': 11,
    'Waste & Recycling': 12
  }

  return industries[industry_display_name];
}

// [START YourAction]
app.post('/', function (req, res) {
  const assistant = new Assistant({request: req, response: res});
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  function getNews (industry_display_name, assistant) {
    let industry_id = industryIdLookup(industry_display_name);
    request(`http://www.educationdive.com/api/v2/news/?industries=${industry_id}&limit=5`, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let bodyJson = JSON.parse(body);
        let stories = bodyJson["objects"];
        let speech = `<speak>Here are the latest ${industry_display_name} stories.`;

        for(let story of stories) {
          speech += `<break time="2s" /> ${story['title']} <break time="1s" /> ${story['teaser']}`;
        }

        speech += '<break time="2s" />Goodbye.</speak>';

        assistant.tell(speech);
      }
    });
  }

  function getIndustries (assistant) {
    request('http://www.educationdive.com/api/v2/industries/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let bodyJson = JSON.parse(body);
        let industries = bodyJson["objects"];

        let speech = `<speak>There are ${bodyJson["meta"]["total_count"]} industries to choose from. They are `;

        for(let item of industries) {
          speech += `<break time="500ms" />${item["display_name"]}, `;
        }

        speech += '</speak>';

        assistant.tell(speech);
      }
    });
  }

  // Fulfill action business logic
  function greetUser (assistant) {
    // Complete your fulfillment logic and send a response
    // assistant.tell('Hello, World!');

    getNews(assistant.getArgument('dive_industry'), assistant);

  }

  // let actionMap = new Map();
  // actionMap.set(WELCOME_ACTION, greetUser);

  // assistant.handleRequest(actionMap);
  assistant.handleRequest(greetUser);
});
// [END YourAction]

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('App listening on port %s', port);
  });
  // [END server]
}

module.exports = app;
