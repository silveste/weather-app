
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


document.addEventListener('DOMContentLoaded', function() {
  // Extract the container width and height that was computed by CSS.
  const chartDiv = document.getElementById('container');
  const width = chartDiv.clientWidth;
  const height = chartDiv.clientHeight;
  //Set the map image into the DOM
  d3.xml('assets/map.svg')
    .then(xml => {
      let htmlSVG = document.getElementById('map'); //SVG element in the html
      let xmlSVG = d3.select(xml.getElementsByTagName('svg')[0]);
      htmlSVG.appendChild(xml.documentElement.getElementById('maproot'));
      //Select the SVG and stores in an object for future uses
      irelandSVG.d3svg = d3.select(htmlSVG)
        .attr('width', width)
        .attr('height', height)
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

/*
function manipulateSVG(){
  d3.select('#container svg')
    .on('click', function(){
      let imgCoords = d3.mouse(this);
      let geoCoords = getGeoCoords(imgCoords);
      console.log('Image Coords: ' + imgCoords[0] + ', ' +imgCoords[1]); //FOR TESTING PURPOSES
      console.log('Geo Coords: ' + geoCoords[0] + ', ' +geoCoords[1]); //FOR TESTING PURPOSES
      let townName = callBackend(`/loc/${geoCoords[0]},${geoCoords[1]}`);
      let weatherData = callBackend(`/weather/${geoCoords[0]},${geoCoords[1]}`);
    });

}
*/

function setMainCitiesWeather() {

  //Get the geo coordinates and img coordinates for every city
  const promArr = mainCities.map( city => {
    return callBackend(`/city/${city}`)
      .then(data => {
        let imgCoords = getImgCoords([data[0].lat,data[0].lon]);
        return {
          city,
          lat: data[0].lat,
          lon: data[0].lon,
          x: imgCoords[0],
          y: imgCoords[1]
        };
      });
  });

  //Once data is resolved set the icons in the map
  Promise.all(promArr).then(res => {
    console.log(res);
    console.log(irelandSVG.d3maproot);
    irelandSVG.d3maproot
      .selectAll('g.icon')
      .data(res)
      .enter()
      .append('g')
        .classed('icon',true)
      .append('circle')
        .attr('fill','black')
        .attr('r',70)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
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
      console.log(url);  //FOR TESTING PURPOSES
      console.log('succeed'); //FOR TESTING PURPOSES
      console.log(data); //FOR TESTING PURPOSES
      return data;
    })
    .catch(err => {
      console.log(url);  //FOR TESTING PURPOSES
      console.log('Error'); //FOR TESTING PURPOSES
      console.log(err); //FOR TESTING PURPOSES
    });
}




//Get main
