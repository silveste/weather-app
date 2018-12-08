// Handlers for requests to the weather API_KEY */
const request = require('request-promise-native');
const api_url = 'https://api.darksky.net/forecast';

/*
getWeather returns an object with weather information,
requires 2 parameters:
-loc: an object with longitude and latitude values
-time: time string formated as UNIX time
*/
module.exports.getWeather = function(loc, time){
  let options = {
    uri: `${api_url}/${process.env.API_KEY}/${loc.latitude},${loc.longitude},${time}`,
    json: true
  };
  return request(options);

};
