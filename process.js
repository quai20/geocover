function initDemoMap() {
  //BASE TILE LAYER 1
  var CartoDB_VoyagerNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });
  //MAP STRUCTURE
  var map = L.map('map', {
    layers: [CartoDB_VoyagerNoLabels],
    minZoom: 6,
    maxZoom: 10,
    worldCopyJump: true,
    inertia: false
  });

  map.setView([46.9, 3.6], 6);

  //INIT RETURN FUNCTION
  return {
    map: map,
  };
}

// MAP CREATION
var mapStuff = initDemoMap();
var map = mapStuff.map;

var gameLayer = new L.LayerGroup();
gameLayer.addTo(map);
var cityLayer = new L.LayerGroup();
cityLayer.addTo(map);

var cities;
var names = [];
var lats = [];
var lons = [];
var difficulty = document.getElementById('difficulty').value;
var score = 0;
var count = 0;
var prop;
var current = new turf.circle([-4,48], 0, { steps: 100, units: "kilometers" });
var support;

var blueIcon = new L.Icon({
  iconUrl: 'dist/icons/marker-icon-2x-blue.png',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [1, -34],
  shadowSize: [18, 18]
});

//search index
const index = new FlexSearch.Index({
  preset: 'default',
  tokenize: "full"
});

//Load data
$.get("data/FrCities3.csv", function (data) {
  cities = data.split("\n");
  for (var i = 0; i < cities.length; i++) {
    names.push(cities[i].split(",")[0]);
    lats.push(cities[i].split(",")[1]);
    lons.push(cities[i].split(",")[2]);
    index.add(i, cities[i].split(",")[0]);
  };

});

var suggestions = document.getElementById("suggestions");
var userinput = document.getElementById("userinput");
userinput.addEventListener("input", show_results, true);

function show_results() {
  var value = this.value;
  var results = index.search(value);
  //console.log(results);
  var entry, childs = suggestions.childNodes;
  var i = 0, len = results.length;

  for (; i < len; i++) {
    entry = childs[i];
    if (!entry) {
      entry = document.createElement("div");
      entry.className = 'suggestion-bk';
      suggestions.appendChild(entry);
    }
    entry.textContent = names[results[i]];
    entry.onclick = function () {
      //console.log(this.textContent);
      document.getElementById('userinput').value = this.textContent;
    };
  }
  while (childs.length > len) {
    suggestions.removeChild(childs[i])
  }
}

function StartFunc() {

  gameLayer.clearLayers();
  cityLayer.clearLayers();
  document.getElementById('userinput').value = '';
  document.getElementById('suggestions').innerHTML = "";
  current = new turf.circle([-4,48], 0, { steps: 100, units: "kilometers" });
  score = 0;
  count = 0;
  document.getElementById('score').innerHTML = score;
  document.getElementById('count').innerHTML = count;
  //get difficulty  
  difficulty = document.getElementById('difficulty').value;  
  //get gamesh
  gamesh = document.getElementById('gamesh').value;  
  if(gamesh=='bretagne'){support=britanny;}
  if(gamesh=='france'){support=francesh.features[0];}
  // Draw  
  L.geoJSON(support).addTo(gameLayer);
}

function GuessFunc() {

  //Get prop
  prop = document.getElementById('userinput').value;
  //get fuzz ration with every city
  var ratios = []
  for (var i = 0; i < names.length; i++) {
    ratios[i] = fuzzball.ratio(prop, names[i]);
  }
  ix = argMax(ratios);
  //seuil à ajuster
  if (ratios[ix] < 85) {
    console.log('Unknown city !');
  }
  else {
    // draw
    count +=1 ;
    document.getElementById('count').innerHTML = count;       

    gameLayer.clearLayers();

    var markerb = new L.Marker(new L.LatLng(lats[ix], lons[ix]), { title: names[ix], icon: blueIcon }).addTo(cityLayer);
    markerb.bindTooltip(names[ix]);

    var c1 = new turf.circle([lons[ix],lats[ix]], difficulty, { steps: 100, units: "kilometers" });
    var allCircle = turf.union(turf.featureCollection([current,c1]));    
    L.geoJSON(allCircle).addTo(gameLayer);
    current = allCircle;
    
    var difference = turf.difference(turf.featureCollection([support,allCircle]));
    L.geoJSON(difference,{style:{'color':'red'}}).addTo(gameLayer);

    if(difference==null){
      score = 100;
      alert('Well done');
    }
    else{
      score = (turf.area(support)-turf.area(difference))*100/turf.area(support);
      if(score.toFixed(2)>=100){
        alert('Well done');
      }
    }    
    document.getElementById('score').innerHTML = score.toFixed(2);    
    
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function argMax(array) {
  return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

//reshape map
document.addEventListener("DOMContentLoaded", (event) => {
  map.invalidateSize();
});
