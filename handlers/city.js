// Handlers for requests to the weather API_KEY */
const request = require('request-promise-native');
const api_url = 'https://nominatim.openstreetmap.org/reverse';

/*
getWeather returns an object with weather information,
requires 2 parameters:
-loc: an object with longitude and latitude values
-time: time string formated as UNIX time
*/
const getCity = function(loc){
  let options = {
    uri: `${api_url}?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=10`,
    json: true,
    headers: {
      'User-Agent': 'request' // Required by OSM Nominatim usage policy
    }
  };
  return request(options);
};

module.exports = getCity;
