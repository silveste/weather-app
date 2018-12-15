
/*global d3*/

//define an object with map of ireland properties
var irelandSVG = {
  d3svg: null,
  //d3maproot: null,
  mapDimensions: {
    north: 55.6,
    south: 51.2,
    west: -11.0,
    east: -5.0,
    imgHeight: 1807.0706,
    imgWidth: 1449.8049,
  }
};

//Define today and day showed in document;
var date = {
  day: null,
  today:null
};
//Define object that contains all Data
var mainData = {};

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

      //Set Today's Date
      document.querySelector('#back').onclick = function(){changeDay('setYesterday');};
      document.querySelector('#forward').onclick = function(){changeDay('setTomorrow');};
      UpdateDay(new Date());

      //getBulkData gets the data for the for the cities specified in mainCities when
      //the page load for the first time
      getBulkData();
    });
});

function getBulkData() {

  //Get the geo coordinates, img coordinates and weather conditions for every city
  var promArr = mainCities.map( city => {

    //1st call the backend to retrieve cities coordinates from Nominatim API
    let locPromise = callBackend(`/city/${city}`);

    //2nd call the backend to retrieve weather data from darksky API
    let weatherPromise = locPromise.then((locData) => {
      return callBackend(`/weather/${locData[0].lat},${locData[0].lon}`)
        .then(weatherData =>{
          const promArr = weatherData.daily.data.map((weatherInf) => {
            return  d3.xml(`assets/${weatherInf.icon}.svg`)
              .then(xml =>{
                return xml.documentElement;
              })
              .then(icon => {
                weatherInf.icon = icon;
                return weatherInf;
              });
          });
          return Promise.all(promArr)
            .then(result => {
              return result.reduce((acc, weatherInf) => {
                acc[weatherInf.time] = weatherInf;
                delete acc[weatherInf.time].time;
                return acc;
              }, {});
            });
        });
    });
    //Data is returned when both calls have been resolved
    return Promise.all([locPromise, weatherPromise])
      .then(result =>{
        let locData = result[0];
        let imgCoords = getImgCoords([locData[0].lat,locData[0].lon]);
        let solved = {
          city,
          lat: locData[0].lat,
          lon: locData[0].lon,
          x: imgCoords[0],
          y: imgCoords[1],
          days: result[1]
        };
        //console.log(solved); //FOR TESTING PURPOSES
        return solved;
      });
  });
  Promise.all(promArr).then(res =>{
    mainData = res;
    console.log(mainData); //FOR TESTING PURPOSES
    setIcons();
  });
}

function setIcons(){
  const currentDay = date.day/1000;
  //D3 general update pattern
  let d3Update =   irelandSVG.d3svg.select('#maproot')
    .selectAll('svg.icon')
    .remove();
  //All elements are removed when updating therefore there is no need for exit selector

  let d3Enter = irelandSVG.d3svg.select('#maproot')
    .selectAll('svg.icon')
    .data(mainData)
    .enter();

  d3Enter.merge(d3Update)
    .append( d => d.days[currentDay].icon)
    .attr('xmlns:svg', null)
    .attr('xmlns', null)
    .attr('version',null)
    .attr('height',250)
    .attr('width',250)
    .classed('icon',true)
    .attr('x', d => d.x - 125)
    .attr('y', d => d.y - 125);
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

//Update all DOM elements that depends on date, requires a Date object as a parameter
function UpdateDay(day){
  //Day must start at 00:00:00
  let dayMsec = day.getTime() % 86400000;
  date.day = new Date(day.getTime() - dayMsec);
  if(!date.today){ //required when initialising the page
    date.today = date.day;
  }
  document.getElementById('date').textContent = day.toLocaleString('en-GB',{
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  let fwd = document.querySelector('#forward');
  let bck = document.querySelector('#back');
  fwd.disabled = false;
  bck.disabled = false;
  let diffDays = date.day.getTime() - date.today.getTime();
  if (diffDays === 0){
    bck.disabled = true;
  }
  if (diffDays === 7*86400000){
    fwd.disabled = true;
  }
  setIcons();
}

function changeDay(action){
  let dayInt = date.day.getTime();
  const msecDay = 86400000;
  switch (action) {
  case ('setYesterday'):
    dayInt -= msecDay;
    break;
  case ('setTomorrow'):
    dayInt += msecDay;
    break;
  }
  UpdateDay(new Date(dayInt));
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
