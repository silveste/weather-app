
/*global d3*/

//define an object with map of ireland properties
var irelandSVG = {
  d3svg: undefined,
  //d3maproot: null,
  mapDimensions: {
    north: 55.6,
    south: 51.2,
    west: -11.0,
    east: -5.0,
    imgHeight: 1807.0706,
    imgWidth: 1449.8049,
    imgRel: 1449.8049/1807.0706
  }
};

//Tooltip object, will appear when user hovers an icons
var tooltip;

//Define today and day showed in document;
var date = {
  day: undefined,
  today: undefined
};
//Define object that contains all Data
var mainData = {};

//Define an array with Ireland main cities
const mainCities = ['Armagh', 'Athlone', 'Belfast', 'Cork', 'Derry', 'Donegal','Drogheda', 'Dublin', 'Galway',
  'Kilkenny', 'Limerick', 'Sligo', 'Tralee', 'Waterford', 'Westport'];

document.addEventListener('DOMContentLoaded', function() {

  //Set the map image into the DOM
  d3.xml('assets/map.svg')
    .then(xml => {
      let htmlSVG = document.getElementById('map'); //SVG element in the html
      let xmlSVG = d3.select(xml.getElementsByTagName('svg')[0]);
      htmlSVG.appendChild(xml.documentElement.getElementById('maproot'));
      //Select the SVG and stores in an object for future uses
      irelandSVG.d3svg = d3.select(htmlSVG)
        .attr('viewBox', xmlSVG.attr('viewBox'));
      //Set svg size.
      setSize(irelandSVG.d3svg, 0.85, irelandSVG.mapDimensions.imgRel);
      //Set onclick listener for add icons into the map
      irelandSVG.d3svg.on('click', function(){
        mapClicked(this);
      });

      //Set Today's Date
      document.querySelector('#back').onclick = function(){changeDay('setYesterday');};
      document.querySelector('#forward').onclick = function(){changeDay('setTomorrow');};
      const today = new Date(Date.now() - (Date.now()%86400000) + new Date(Date.now()).getTimezoneOffset()*60000).getTime();
      UpdateDay(today);

      //Set search listener
      document.querySelector('#search-button').onclick = function(){
        search(document.querySelector('#search-input').value);
        document.querySelector('#search-input').value = null;
        this.disabled = true;
      };

      //The search button is activated when input has content
      document.querySelector('#search-input').oninput = function(){
        document.querySelector('#search-button').disabled = this.textContent !== "";
      };

      //getBulkData gets the data for the for the cities specified in mainCities when
      //the page load for the first time
      getBulkData();
    });
  //Tooltip, when the user hovers over an Icon, a tool tip shows more information
  tooltip = d3.select('body')
    .append('div')
    .classed('tooltip', true);
  setSize(tooltip, 0.50, 1, true);
});

window.addEventListener('resize', function() {
  setSize(irelandSVG.d3svg, 0.85, irelandSVG.mapDimensions.imgRel);
  setSize(tooltip, 0.50, 1, true);
});
//Resize a d3 element to be a percentage X for the shorter
//axis of the body
//Ratio indicates the size from 0 to 1
//Relation indicates the desired relation width/height of the element
function setSize(d3element, ratio, relation, widthOnly = false){
  //get body width and height
  let width = d3.select('body').node().clientWidth;
  let height = d3.select('body').node().clientHeight;

  //Determine best fit for the map
  let bodyRel = width/height;
  if(bodyRel <= relation) {
    width *= ratio;
    height = width/relation;
  }  else {
    height *=ratio;
    width = height*relation;
  }
  d3element
    .attr('width', width)
    .style('width', Math.floor(width) + 'px');
  if (!widthOnly) {
    d3element
      .attr('height', height)
      .style('height', Math.floor(height) + 'px');
  }
}

function getBulkData() {
  //Get the geo coordinates, img coordinates and weather conditions for every city
  var promArr = mainCities.map( city => {
    //Retrieve cities coordinates from Nominatim API
    let CityInfoPromise = getCityInfoPromise(city)
      .then(cityInfo => {
        cityInfo.place = city;
        return cityInfo;
      });
    //Retrieve weather data from darksky API
    let weatherPromise = CityInfoPromise.then((cityInfo) => {
      return getWeatherPromise(cityInfo.lat,cityInfo.lon);
    });
    return mergeDataPromise([CityInfoPromise,weatherPromise]);
  });
  Promise.all(promArr).then(res =>{
    mainData = res;
    console.log(mainData); //FOR TESTING PURPOSES
    setIcons();
  });
}

function mapClicked(d3Element){
  let imgCoords = d3.mouse(d3Element);
  let geoCoords = getGeoCoords(imgCoords);
  let locInfoPromise = getLocInfoPromise(...geoCoords)
    .then(locData =>{
      locData.xCoord = imgCoords[0];
      locData.yCoord = imgCoords[1];
      //console.log(locData); //FOR TESTING PURPOSES
      return locData;
    });
  let weatherPromise = locInfoPromise.then((cityInfo) => {
    return getWeatherPromise(cityInfo.lat,cityInfo.lon);
  });
  mergeDataPromise([locInfoPromise,weatherPromise])
    .then(res => {
      mainData.push(res);
      console.log(mainData); //FOR TESTING PURPOSES
      setIcons();
    })
    .catch(err => console.log(err));
}

function search(query){
  //Retrieve city coordinates from Nominatim API
  let CityInfoPromise = getCityInfoPromise(query)
    .then(cityInfo => {
      if(cityInfo instanceof Error){
        alert(cityInfo);
        return;
      }
      cityInfo.place = query.toLowerCase().replace(/\b\w/g, (chr) => chr.toUpperCase());
      return cityInfo;
    });
  let weatherPromise = CityInfoPromise.then((cityInfo) => {
    return getWeatherPromise(cityInfo.lat,cityInfo.lon);
  });
  mergeDataPromise([CityInfoPromise,weatherPromise])
    .then( res => {
      mainData.push(res);
      console.log(mainData); //FOR TESTING PURPOSES
      setIcons();
    });
}

function getCityInfoPromise(city){
  return callBackend(`/city/${city}`)
    .then(cityData =>{
      cityData = cityData[0];
      let imgCoords = getImgCoords([cityData.lat,cityData.lon]);
      cityData.xCoord = imgCoords[0];
      cityData.yCoord = imgCoords[1];
      //console.log(cityData);//TESTING PURPOSES
      return cityData;
    })
    .catch(() => new Error(`I can't find ${city}`));
}

function getLocInfoPromise(lat,lon){
  return callBackend(`/loc/${lat},${lon}`)
    .then(locData =>{
      if (locData.error) {
        throw locData.error;
      }
      let response = {
        lat: locData.lat,
        lon: locData.lon,
        place: locData.address.city || locData.address.county|| locData.address.state || locData.address.contry
      };
      //console.log(response); //FOR TESTING PURPOSES
      return response;
    })
    .catch((err) => {
      console.log(err);
    });
}


function getWeatherPromise(lat, lon) {
  return callBackend(`/weather/${lat},${lon}`)
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
          //console.log(result); //TESTING PURPOSES
          return result.reduce((acc, weatherInf) => {
            acc[weatherInf.time] = weatherInf;
            delete acc[weatherInf.time].time;
            return acc;
          }, {});
        });
    });
}

function mergeDataPromise(promArray){
  return Promise.all(promArray)
    .then(result =>{
      let cityData = result[0];
      let solved = {
        place: cityData.place,
        lat: cityData.lat,
        lon: cityData.lon,
        x: cityData.xCoord,
        y: cityData.yCoord,
        days: result[1]
      };
      //console.log(solved); //FOR TESTING PURPOSES
      return solved;
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
    .data(mainData, (d) => d.place) //DOM elements are matched with data through place name
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
    .attr('y', d => d.y - 125)
    .on('click', (d, i) => { //By clicking the element will be removed
      d3.event.stopPropagation();
      mainData.splice(i,1);
      tooltip
        .style('opacity', 0)
        .selectAll('*')
        .remove();
      setIcons();
    })
    .on('mouseover', (d) => { //Hovering over the icon show a tooltip with information
      let daysArr = Object.entries(d.days).sort((a,b) => a[0] - b[0]);
      //console.log(daysArr); //For testing purposes
      let maxTemp = Math.ceil(d3.max(daysArr, d=> d[1].temperatureMax)/5)*5;
      let minTemp = Math.floor(d3.min(daysArr, d=> d[1].temperatureMin)/5)*5;
      let tempScale = d3.scaleLinear()
        .domain([maxTemp, minTemp])
        .range([150, 700]);
      let maxPrec = Math.ceil(d3.max(daysArr, d=> d[1].precipIntensity));
      let precScale = d3.scaleLinear()
        .domain([maxPrec, 0])
        .range([150, 700]);

      tooltip
        .style('opacity', 1)
        .append('p')
        .style('font-weight', 'bold')
        .text(d.place);
      tooltip
        .append('p')
        .classed('city', true)
        .text(d.days[currentDay].summary);

      let svgtt = tooltip
        .append('svg');
      let ttSvgEnt = svgtt
        .attr('version', '1.1')
        .attr('baseProfile', 'full')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('viewBox', '0 0 1000 1000')
        .classed('chart', true)
        .selectAll('g')
        .data(daysArr, d => d[0])
        .enter();
      //Chart spacer between days
      ttSvgEnt
        .filter((d, i) => i != 0 )
        .append('line')
        .attr('x1', (d, i) => 200 + i*100)
        .attr('x2', (d, i) => 200 + i*100)
        .attr('y1', 100)
        .attr('y2', 900)
        .classed('chart-line',true);
      //Chart icons
      ttSvgEnt
        .append(d => d[1].icon.cloneNode(true))
        .attr('xmlns:svg', null)
        .attr('xmlns', null)
        .attr('version',null)
        .attr('height',100)
        .attr('width',100)
        .attr('viewBox', '50 50 400 400')
        .classed('icon',true)
        .attr('x', (d, i) => 100 + 100*i)
        .attr('y', 50);
      //Prec bars
      ttSvgEnt
        .append('rect')
        .attr('x', (d,i) => 102 + 100*i)
        .attr('width', 96)
        .attr('y',d => precScale(d[1].precipIntensity))
        .attr('height', d => 700 - precScale(d[1].precipIntensity) + 150)
        .classed('prec-bar', true);
      //Temperature bars
      ttSvgEnt
        .append('rect')
        .attr('x', (d,i) => 110 + 100*i)
        .attr('width', 80)
        .attr('y',d => tempScale(d[1].temperatureMax))
        .attr('height', d => tempScale(d[1].temperatureMin) - tempScale(d[1].temperatureMax) + 150)
        .attr('rx', 40)
        .attr('ry', 40)
        .classed('temperature-bar', true);
      //Max temperature text
      ttSvgEnt
        .append('text')
        .attr('x', (d,i) => 150 + 100*i)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'hanging')
        .style('dominant-baseline', 'hanging')
        .style('fill', '#f00')
        .attr('y', d => tempScale(d[1].temperatureMax) + 30)
        .classed('temp-text', true)
        .text(d => Math.floor(d[1].temperatureMax) + 'ºC');
      //Min temperature text
      ttSvgEnt
        .append('text')
        .attr('x', (d,i) => 150 + 100*i)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'baseline')
        .style('dominant-baseline', 'baseline')
        .style('fill', '#00f')
        .attr('y', d => tempScale(d[1].temperatureMin) +(150 - 30))
        .classed('temp-text', true)
        .text(d => Math.floor(d[1].temperatureMin) + 'ºC');
      //Days Text
      ttSvgEnt
        .append('text')
        .attr('x', (d,i) => 150 + 100*i)
        .attr('textLength', 70)
        .attr('font-size', 25)
        .style('alingment-baseline', 'hanging')
        .style('dominant-baseline', 'hanging')
        .style('fill', '#444')
        .attr('y', 850)
        .classed('day-text', true)
        .text(d => {
          let date = new Date(d[0]*1000);
          let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          return days[date.getDay()];
        });
      //Prec axis
      svgtt
        .append('line')
        .attr('x1', 900)
        .attr('x2', 900)
        .attr('y1', 150)
        .attr('y2', 850)
        .classed('chart-axis',true);
      svgtt
        .append('line')
        .attr('x1', 895)
        .attr('x2', 910)
        .attr('y1', 150)
        .attr('y2', 150)
        .classed('chart-axis',true);
      svgtt
        .append('line')
        .attr('x1', 895)
        .attr('x2', 910)
        .attr('y1', 850)
        .attr('y2', 850)
        .classed('chart-axis',true);
      svgtt
        .append('text')
        .attr('x', 910)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'baseline')
        .style('dominant-baseline', 'baseline')
        .style('text-anchor', 'start')
        .style('fill', '#444')
        .attr('y', 145)
        .text(maxPrec);
      svgtt
        .append('text')
        .attr('x', 910)
        .attr('textLength', 75)
        .attr('font-size', 25)
        .style('alingment-baseline', 'hanging')
        .style('dominant-baseline', 'hanging')
        .style('text-anchor', 'start')
        .style('fill', '#444')
        .attr('y', 150)
        .text('mm/h');
      svgtt
        .append('text')
        .attr('x', 910)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'middle')
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'start')
        .style('fill', '#444')
        .attr('y', 845)
        .text('0');
      svgtt
        .append('text')
        .attr('x', 910)
        .attr('textLength', 75)
        .attr('font-size', 25)
        .style('alingment-baseline', 'hanging')
        .style('dominant-baseline', 'hanging')
        .style('text-anchor', 'start')
        .style('fill', '#444')
        .attr('y', 850)
        .text('mm/h');

      //Temperature Axis
      svgtt
        .append('line')
        .attr('x1', 100)
        .attr('x2', 100)
        .attr('y1', 150)
        .attr('y2', 850)
        .classed('chart-axis',true);
      svgtt
        .append('line')
        .attr('x1', 90)
        .attr('x2', 105)
        .attr('y1', 150)
        .attr('y2', 150)
        .classed('chart-axis',true);
      svgtt
        .append('line')
        .attr('x1', 90)
        .attr('x2', 105)
        .attr('y1', 850)
        .attr('y2', 850)
        .classed('chart-axis',true);
      svgtt
        .append('text')
        .attr('x', 85)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'middle')
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'end')
        .style('fill', '#444')
        .attr('y', 150)
        .text(maxTemp + 'ºC');
      svgtt
        .append('text')
        .attr('x', 85)
        .attr('textLength', 50)
        .attr('font-size', 25)
        .style('alingment-baseline', 'middle')
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'end')
        .style('fill', '#444')
        .attr('y', 850)
        .text(minTemp + 'ºC');

    })
    .on('mousemove', () => { //The toltip changes position depending on the mouse 'mousemove'
      setToolTipPos(d3.event.x,d3.event.y);
    })
    .on('mouseout', () =>{
      tooltip
        .style('opacity', 0)
        .selectAll('*')
        .remove();
    });
}

//Set the tooltip position in relation with the icon position and the space available
function setToolTipPos(iconX,iconY){
  //get body bounding client rect
  let bodyDOMRect = d3.select('body').node().getBoundingClientRect();
  //get body visible width and height
  let bodyW = bodyDOMRect.width;
  let bodyH = bodyDOMRect.height;

  //Distances from the icon to the viewport borders
  let dist = {
    top: iconY,
    right: bodyW - iconX,
    bottom: bodyH - iconY,
    left: iconX
  };
  let ttWidth = tooltip.node().getBoundingClientRect().width;
  let ttHeight = tooltip.node().getBoundingClientRect().height;
  /*
  Pos will get the following values to determine the position of the viewBox in relation with the icon
  units are related with horizontal position, 0 = left, 1 = center, 2 = right
  Tenhs are related with vertical position, 00 = top, 10 = center, 20 = bottom
  */
  let pos = 0;
  /*
  The tooltip will be placed with one border matching the icon, and in the area that has maximum space
  The box can match the icon through 8 positions (top-left,top-center,top-right,center-left,
  center-right, bottom-left and bottom-right)
  The best position is where the distance to the opposite borders is maximum after placing the box
  */
  //Horizontal position
  let left = (dist.right - ttWidth) * dist.left;
  let right = (dist.left - ttWidth) * dist.right;
  let centerH = (dist.left -ttWidth/2) * (dist.right - ttWidth/2);
  let horizontal = [left,centerH,right];
  pos += horizontal.indexOf(Math.max(...horizontal));

  //Vertical
  let top = (dist.bottom - ttHeight) * dist.top;
  let bottom = (dist.top - ttHeight) * dist.bottom;
  let centerV = dist.top + dist.bottom - ttHeight;
  let vertical = [top, centerV, bottom];
  pos += vertical.indexOf(Math.max(...vertical))*10;

  //Fix when pos = 11
  if (pos == 11 && bodyH >= bodyW) {
    pos = (dist.top <= dist.bottom)? 1:21;
  } else if (pos == 11 && bodyH < bodyW) {
    pos = (dist.left <= dist.right)? 10:12;
  }
  let x, y, cl;
  switch (pos) {
  case 0:
    y = iconY + 10 + 'px';
    x = iconX - 25 + 'px';
    cl = 'top-left';
    break;
  case 1:
    y = iconY + 10 + 'px';
    x = iconX - (ttWidth / 2) +'px';
    cl = 'top-center';
    break;
  case 2:
    y = iconY + 10 + 'px';
    x = iconX - (ttWidth) + 25 +'px';
    cl = 'top-right';
    break;
  case 10:
    y = iconY - (ttHeight / 2) +'px';
    x = iconX + 10 + 'px';
    cl = 'center-left';
    break;
  case 12:
    y = iconY - (ttHeight / 2) +'px';
    x = iconX - (ttWidth) - 10 + 'px';
    cl = 'center-right';
    break;
  case 20:
    y = iconY - (ttHeight) - 10 +'px';
    x = iconX - 25 + 'px';
    cl = 'bottom-left';
    break;
  case 21:
    y = iconY - (ttHeight) - 10 +'px';
    x = iconX - (ttWidth / 2) +'px';
    cl = 'bottom-center';
    break;
  case 22:
    y = iconY - (ttHeight) - 10 +'px';
    x = iconX - (ttWidth) + 25 + 'px';
    cl = 'bottom-right';
    break;
  }

  tooltip
    .style('left', x)
    .style('top', y)
    .attr('class', 'tooltip')
    .classed(cl, true);
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
  date.day = day;
  if(!date.today){ //required when initialising the page
    date.today = date.day;
  }
  document.getElementById('date').textContent = new Date(day).toLocaleString('en-GB',{
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  let fwd = document.querySelector('#forward');
  let bck = document.querySelector('#back');
  fwd.disabled = false;
  bck.disabled = false;
  let diffDays = date.day - date.today;
  if (diffDays === 0){
    bck.disabled = true;
  }
  if (diffDays === 7*86400000){
    fwd.disabled = true;
  }
  setIcons();
}

function changeDay(action){
  let dayInt = date.day;
  const msecDay = 86400000;
  switch (action) {
  case ('setYesterday'):
    dayInt -= msecDay;
    break;
  case ('setTomorrow'):
    dayInt += msecDay;
    break;
  }
  UpdateDay(dayInt);
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
