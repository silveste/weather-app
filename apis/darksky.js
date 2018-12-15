// Handlers for requests to the weather API_KEY */
const request = require('request-promise-native');
const api_url = 'https://api.darksky.net/forecast';
const fs = require('fs');
var data = {};
/*
getWeather returns an object with weather information,
requires 2 parameters:
-loc: an object with longitude and latitude values
-time: time string formated as UNIX time
*/
const getWeather = function(loc){
  let reqResponse;
  try {
    let fileContent = fs.readFileSync('./weather.json');
    data = JSON.parse(fileContent);
    reqResponse = data[`${loc.latitude}-${loc.longitude}`];
  } catch (err) {
    console.log(err);
  }
  if(reqResponse){
    console.log('Cached weather data');
    return new Promise((resolve) => {
      resolve(reqResponse);
    });
  } else {
    console.log('Weather data from API');
    let options = {
      uri: `${api_url}/${process.env.API_KEY}/${loc.latitude},${loc.longitude}?exclude=currently,minutely,hourly,alerts,flags`,
      json: true
    };
    let reqPromise = request(options);
    reqPromise.then(d => {
      data[`${loc.latitude}-${loc.longitude}`] = d;
      fs.writeFile('./weather.json', JSON.stringify(data), 'utf8', (err) => {
        if(err){
          console.log(err);
        }
      });
    });
    return reqPromise;
  }
};

// The following code deesn't use a cache file to store results
/*
const getWeather = function(loc){
  let options = {
    uri: `${api_url}/${process.env.API_KEY}/${loc.latitude},${loc.longitude}?exclude=currently,minutely,hourly,alerts,flags`,
    json: true
  };
  return request(options);
};
*/
module.exports = getWeather;
