let map;
//let marker;
const socket = io.connect("https://gamedata.pcu.ac.kr:49155");
// const socket = io.connect("http://127.0.0.1:8500");
let markers = [];
let lines = [];
let locals = [];
let drawingManager = null;
let sideMarker = null;

let gps;
let watch;

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
    // socket.emit("sendGPS", {
    //   id: socket.id,
    //   lat: gps.lat,
    //   lon: gps.lon,
    // });
    // console.log(watch);
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
  //watch = navigator.geolocation.watchPosition(success, error, options);
  navigator.geolocation.watchPosition(success, error, options);
  // watch = navigator.geolocation.getCurrentPosition(success, error, options);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.317623, lng: 127.367725 },
    zoom: 18,
    heading: 91,
    tilt: 0,
    mapId: "d92c89799965a9e5",
  });
}

// let markers = [];
//위치 두개 -> for문을 한번 돌때마다 marker변수를 덮어씌우기를 해서 객체를 생성하고, 지도에 그리는 작업반복
socket.on("sendMarkers", (data) => {
  if (markers) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(null); //마커랑 라인 지우는 역할
    }
  }
  for (let i = 0; i < data.length; i++) {
    let marker; //data = [2]
    if (data[i].id == socket.id) {
      //const image =
      //("https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png");
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(data[i].gps.lat, data[i].gps.lon),
        //icon: image,
      }); //marker변수에 마커 객체를 할당하는건데
    } else {
      //상대방꺼
      const newGPS = GPS2Local(data[i].gps); //상대좌표
      if (i == 0) {
        //상대방이 0번인덱스고, 내가 1번인덱스일때
        marker = new google.maps.Marker({
          position: new google.maps.LatLng(
            data[1].gps.lat + newGPS.z,
            data[1].gps.lon + newGPS.x
          ),
        });
      } else {
        //상대방이 1번인덱스고, 내가 0번인덱스일때
        marker = new google.maps.Marker({
          position: new google.maps.LatLng(
            data[0].gps.lat + newGPS.z,
            data[0].gps.lon + newGPS.x
          ),
        });
      }
    }
    markers.push(marker); //length = 2
    marker.setMap(map); //찍는건데
    //webxr->
  }

  if (lines.length >= 2) {
    drawingManager.setMap(null);
  }
  lines = [];
  if (locals.length > 0) {
    for (let i = 0; i < data.length; i++) {
      // lines.push(new google.maps.LatLng(data[i].gps.lat, data[i].gps.lon));
      lines.push(
        new google.maps.LatLng(gps.lat + locals[i].z, gps.lon + locals[i].x)
      );
      //gps -> 자신의 gps(절대좌표)
      //locals[2] -> 0번재는 0,0 이고 1번째는 상대방의 상대좌표
    }
  }

  if (lines.length == 2) {
    drawingManager = new google.maps.Polyline({
      path: lines,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    drawingManager.setMap(map);

    //가운데 마커찍는 곳
    // const sideLat = (data[0].gps.lat + data[1].gps.lat) / 2;
    // const sideLon = (data[0].gps.lon + data[1].gps.lon) / 2;
    const sideLat = gps.lat + locals[1].z / 2;
    const sideLon = gps.lon + locals[1].x / 2;
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(sideLat, sideLon),
    });
    markers.push(marker);
    marker.setMap(map);
  }
});

//socket.emit
// getGPS();

function init() {
  //setInterval(getGPS, 1000);
  getGPS();
}

function GPS2Local(pGps) {
  locals[0] = { x: 0, z: 0 };
  const lat = pGps.lat;
  const lon = pGps.lon;

  const localLat = lat - gps.lat;
  const localLon = lon - gps.lon;

  locals[1] = { x: localLon, z: localLat };
  returnVal = { x: localLon, z: localLat };
  return returnVal;
}
