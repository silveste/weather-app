/*
Requires the following env variables:
API_KEY
*/
const express = require('express');
const getWeather = require('./handlers/weather');
const getCity = require('./handlers/city');
const app = express();

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'http://localhost';

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/public'));
//app.use(bodyParser.json());

app.get('/weather/:lat,:long', function(req, res){
  getWeather({latitude: req.params.lat, longitude: req.params.long}, Math.floor(Date.now()/1000))
    .then( data => res.json(data))
    .catch( (e) => {
      console.error(e.message);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/city/:lat,:long', function(req, res){
  getCity({latitude: req.params.lat, longitude: req.params.long})
    .then( data => res.json(data))
    .catch( (e) => {
      console.error(e.message);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/', function(req, res){
  res.sendFile('index.html');
});

app.listen(PORT, function(){
  console.log(`Server initialized on ${HOSTNAME}:${PORT}`);
});
