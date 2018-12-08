/*
Requires the following env variables:
API_KEY
*/
const request = require('request');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'http://localhost';

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/public'));
//app.use(bodyParser.json());

app.get('/api', function(req, res){
  console.log(process.env.API_KEY);
  request(`https://api.darksky.net/forecast/${process.env.API_KEY}/53.9954493,-6.8981243`,
    function(error, response ,body){
      console.log('#################### ERRORS #####################################');
      console.log('error:', error); // Print the error if one occurred
      console.log('#################### RESPONSE & STATUS CODE #####################################');
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('#################### BODY #####################################');
      body = JSON.parse(body);
      console.log('body:', body); // Print the HTML for the Google homepage.
      res.json(response.body);
    }
  );
});

app.get('/', function(req, res){
  res.sendFile('index.html');
});

app.listen(PORT, function(){
  console.log(`Server initialized on ${HOSTNAME}:${PORT}`);
});
