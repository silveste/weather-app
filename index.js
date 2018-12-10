/*
Requires the following env variables:
API_KEY
*/
const express = require('express');
const getWeather = require('./apis/darksky');
const geocoder = require('./apis/nominatim');
const app = express();

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'http://localhost';

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/public'));

app.get('/weather/:lat,:long', function(req, res){
  getWeather({latitude: req.params.lat, longitude: req.params.long})
    .then( data => res.json(data))
    .catch( (e) => {
      console.error(e.message);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/loc/:lat,:lon', function(req, res){
  geocoder.reverse({lat: req.params.lat, lon: req.params.lon})
    .then( data => res.json(data))
    .catch( (e) => {
      console.error(e.message);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/city/:city', function(req, res){
  geocoder.search({q: req.params.city})
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
