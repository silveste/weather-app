/*
This app has been developed by Antonio Fernandez to create a data visualization
for the module CA682 Data Management and Visualisation of GCAI1 Grad Cert in Artificial
Intelligence  course (2018/2019)
*/

/*global d3*/
document.addEventListener('DOMContentLoaded', function() {
  // Extract the width and height that was computed by CSS.
  var chartDiv = document.getElementById('container');
  var width = chartDiv.clientWidth;
  var height = chartDiv.clientHeight;

  //Set the map image into the DOM
  d3.svg('map.svg')
    .then(svg => {
      let importedNode = document.importNode(svg.documentElement, true);
      chartDiv.appendChild(importedNode);
    });

  //AJAX request
  d3.json('/api')
    .then(data => {
      console.log('succeed');
      console.log(data);
    })
    .catch(err => {
      console.log('Error');
      console.log(err);
    });
});
