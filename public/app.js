/*
This app has been developed by Antonio Fernandez to create a data visualization
for the module CA682 Data Management and Visualisation of GCAI1 Grad Cert in Artificial
Intelligence  course (2018/2019)
*/

/*global d3*/
document.addEventListener('DOMContentLoaded', function() {
  // Extract the width and height that was computed by CSS.
  let chartDiv = document.getElementById('container');
  //Set the map image into the DOM
  d3.svg('map.svg')
    .then(svg => {
      let importedNode = document.importNode(svg.documentElement, true);
      chartDiv.appendChild(importedNode);
      manipulateSVG();
    });
});

function manipulateSVG(){
  d3.select('#container svg')
    .on('click', function(){
      let imgCoords = d3.mouse(this);
      let geoCoords = getGeoCoords(imgCoords);
      console.log('Image Coords: ' + imgCoords[0] + ', ' +imgCoords[1]);
      console.log('Geo Coords: ' + geoCoords[0] + ', ' +geoCoords[1]);
      let townName = callBackend(`/city/${geoCoords[0]},${geoCoords[1]}`);
      let weatherData = callBackend(`/weather/${geoCoords[0]},${geoCoords[1]}`);
    });

}

function getGeoCoords(coords){
  const northBorder = 55.6;
  const southBorder = 51.2;
  const geoHeight = northBorder - southBorder;
  const westBorder = -11.0;
  const eastBorder = -5.0;
  const geoWidth = westBorder - eastBorder;
  const imgHeigth = 1807.0706;
  const imgWidth = 1449.8049;

  //Note: img coords are x,y while geoCords are lat,long
  //therefore values must be swapped
  let lat = northBorder - coords[1]/imgHeigth*geoHeight;
  let long = westBorder - coords[0]/imgWidth*geoWidth;

  return new Array(lat, long);
}

function callBackend(url){
  //AJAX request
  d3.json(url)
    .then(data => {
      console.log('succeed');
      console.log(data);
    })
    .catch(err => {
      console.log('Error');
      console.log(err);
    });
}



//Get main
