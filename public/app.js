
/*global d3*/

//define an object with map of ireland properties
var irelandSVG = {
  d3svg: null,
  d3maproot: null,
  mapDimensions: {
    north: 55.6,
    south: 51.2,
    west: -11.0,
    east: -5.0,
    imgHeight: 1807.0706,
    imgWidth: 1449.8049,
  }
};

//Define an array with Ireland main cities
const mainCities = ['Armagh', 'Athlone', 'Belfast', 'Cork', 'Derry', 'Donegal','Drogheda', 'Dublin', 'Galway',
  'Kilkenny', 'Limerick', 'Sligo', 'Tralee', 'Waterford', 'Westport'];

// Extract the container width and height that was computed by CSS.
const canvas = document.getElementById('container');
const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;

document.addEventListener('DOMContentLoaded', function() {
  //Set the map image into the DOM
  d3.xml('assets/map.svg')
    .then(xml => {
      let htmlSVG = document.getElementById('map'); //SVG element in the html
      let xmlSVG = d3.select(xml.getElementsByTagName('svg')[0]);
      htmlSVG.appendChild(xml.documentElement.getElementById('maproot'));
      //Select the SVG and stores in an object for future uses
      irelandSVG.d3svg = d3.select(htmlSVG)
        .attr('width', canvasWidth)
        .attr('height', canvasHeight)
        .attr('viewBox', xmlSVG.attr('viewBox'));
      irelandSVG.d3maproot =  irelandSVG.d3svg.select('#maproot');

      //Set onclick listener for detailed graphic
      irelandSVG.d3svg.on('click', function(){
        let imgCoords = d3.mouse(this);
        let geoCoords = getGeoCoords(imgCoords);
        console.log('Image Coords: ' + imgCoords[0] + ', ' +imgCoords[1]); //FOR TESTING PURPOSES
        console.log('Geo Coords: ' + geoCoords[0] + ', ' +geoCoords[1]); //FOR TESTING PURPOSES
        //let townName = callBackend(`/loc/${geoCoords[0]},${geoCoords[1]}`);
        //let weatherData = callBackend(`/weather/${geoCoords[0]},${geoCoords[1]}`);
        //weatherData.then(data => console.log(data));
        //let city = callBackend(`/city/Dublin`);
      });
    });

  //Set weather icons in map
  setMainCitiesWeather();
});

function setMainCitiesWeather() {

  //Get the geo coordinates and img coordinates for every city
  const promArr = mainCities.map( city => {

    //1st call the backend to retrieve cities coordinates from Nominatim API
    let locPromise = callBackend(`/city/${city}`);

    //2nd call the backend to retrieve weather data for every city
    let weatherPromise = locPromise.then((locData) => {
      return callBackend(`/weather/${locData[0].lat},${locData[0].lon}`);
    });

    //Set the weather icon
    let iconPromise = weatherPromise.then(weatherData =>{
      const promArr = weatherData.daily.data.map(dailyWeather => {
        return  d3.xml(`assets/${dailyWeather.icon}.svg`)
          .then(xml =>{
            return xml.documentElement;
          });
      });
      return Promise.all(promArr)
        .then(result =>{
          return weatherData.daily.data.map((dailyWeather, i) => {
            return {
              ...dailyWeather,
              iconImg: result[i]
            };
          });
        });
    });

    //Data is returned when both calls have been resolved
    return Promise.all([locPromise,weatherPromise, iconPromise])
      .then(result =>{
        let locData = result[0];
        let imgCoords = getImgCoords([locData[0].lat,locData[0].lon]);
        let solved = {
          city,
          lat: locData[0].lat,
          lon: locData[0].lon,
          x: imgCoords[0],
          y: imgCoords[1],
          dailyWeather: result[2]
        };
        console.log(solved);
        return solved;
      });
  });

  //Once data is resolved, set the icons in the map
  Promise.all(promArr).then(res => {
    irelandSVG.d3maproot
      .selectAll('svg.icon')
      .data(res)
      .enter()
      .append( d => d.dailyWeather[3].iconImg)
      .attr('xmlns:svg', null)
      .attr('xmlns', null)
      .attr('version',null)
      .attr('height',250)
      .attr('width',250)
      .classed('icon',true)
      .attr('x', d => d.x - 125)
      .attr('y', d => d.y - 125);
  });

}

//helper that accept an array of image coords [x,y] and returns and array of geo coords [lat,lon]
function getGeoCoords(imgCoords){
  const {north, south, west, east, imgHeight, imgWidth } = irelandSVG.mapDimensions;
  const geoHeight = north - south;
  const geoWidth = west - east;
  //Note: img coords are x,y while geoCords are lat,long
  //therefore values must be swapped
  let lat = north - imgCoords[1]/imgHeight*geoHeight;
  let long = west - imgCoords[0]/imgWidth*geoWidth;

  return new Array(lat, long);
}

//helper that accept an array of geo coords [lat,lon] and returns and array of image coords [x,y]
function getImgCoords(geoCoords){
  const {north, south, west, east, imgHeight, imgWidth } = irelandSVG.mapDimensions;
  const geoHeight = north - south;
  const geoWidth = west - east;
  //Note: img coords are x,y while geoCords are lat,long
  //therefore values must be swapped
  let y = imgHeight*(north - geoCoords[0])/geoHeight;
  let x = imgWidth*(west - geoCoords[1])/geoWidth;

  return new Array(x,y);
}

//helper that manages all calls to the backend to retrieve data from darksky (weather data)
//and nominatim (cities and position data)
//call backend return a Promise
function callBackend(url){
  //AJAX request
  return d3.json(url)
    .then(data => {
      //console.log(url);  //FOR TESTING PURPOSES
      //console.log('succeed'); //FOR TESTING PURPOSES
      //console.log(data); //FOR TESTING PURPOSES
      return data;
    })
    .catch(err => {
      console.log(url);  //FOR TESTING PURPOSES
      console.log('Error'); //FOR TESTING PURPOSES
      console.log(err); //FOR TESTING PURPOSES
    });
}




//Get main
