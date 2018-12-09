// Handlers for requests to the weather API_KEY */
const Nominatim = require('nominatim-geocoder');
const geocoder = new Nominatim({/* No options */}, {
  zoom: 10,
  limit: 1
});

module.exports = geocoder;
