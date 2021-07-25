let map;
let marker;
const socket = io.connect("https://gamedata.pcu.ac.kr:49154");
// const socket = io.connect("http://127.0.0.1:8500");
let markers = [];

let gps;
let watch;
let i = 0;

function getGPS() {
  function success(position) {
    gps = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };

    socket.emit("sendGPS", {
      id: socket.id,
      gps: gps,
    });
  }

  function error() {
    //alert("error");
    console.log("error");
  }
  const options = {
    enableHighAccuracy: true,
    maximumAge: 300000,
    timeout: 27000,
  };
  watch = navigator.geolocation.watchPosition(success, error, options);
  // watch = navigator.geolocation.getCurrentPosition(success, error, options);
  i++;
  console.log(i);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.317623, lng: 127.367725 },
    zoom: 18,
  });
}

// let markers = [];
//위치 두개 -> for문을 한번 돌때마다 marker변수를 덮어씌우기를 해서 객체를 생성하고, 지도에 그리는 작업반복
socket.on("sendMarkers", (data) => {
  if (markers) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
  }
  for (let i = 0; i < data.length; i++) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(data[i].gps.lat, data[i].gps.lon),
    }); //marker변수에 마커 객체를 할당하는건데
    markers.push(marker);
    marker.setMap(map); //찍는건데
  }
});

//socket.emit
// getGPS();

function init() {
  setInterval(getGPS, 1000);
}
