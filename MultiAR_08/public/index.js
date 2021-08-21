let map;
//let marker;
const socket = io.connect("https://gamedata.pcu.ac.kr:49154");
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
    heading: 0,
    tilt: 0,
    mapId: "d92c89799965a9e5",
  });
  //map.setHeading(map.getHeading() + 90);
  //console.log(map.getHeading());
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
      console.log(locals);
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
  //document.getElementById("compass").innerHTML = `하이`;
  window.addEventListener("deviceorientation", handleOrientation, false);
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

let heading = null;

const handleOrientation = (event) => {
  const a = document.getElementById("compass");
  a.innerHTML = "작동은합니다";
  if (event.webkitCompassHeading) {
    // some devices don't understand "alpha" (especially IOS devices)
    heading = event.webkitCompassHeading;
  } else {
    heading = compassHeading(event.alpha, event.beta, event.gamma);
  }
  if (map) {
    map.setHeading(heading);
  }
  if (heading && locals.length > 1 && gps) {
    const y = Math.sin(locals[1].x) * Math.cos(locals[1].z);
    const x =
      Math.cos(gps.lat) * Math.sin(gps.lat + locals[1].z) -
      Math.sin(gps.lat) *
        Math.cos(gps.lat + locals[1].z) *
        Math.cos(locals[1].x);
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const result = getRealAngle(heading, angle);
    a.innerHTML = `CompassDegree: ${Math.ceil(
      heading
    )}, 계산한 각도: ${result}, angle: ${angle}`;
  }
};

function getRealAngle(heading, angle) {
  //compassDegree, 역탄젠트값(절대각도)
  let realAngle = 0;
  if (angle < 0) {
    realAngle = 360 - heading + 360 + angle;
  } else {
    realAngle = 360 - heading + angle;
  }
  if (realAngle > 360) {
    realAngle -= 360;
  }
  if (realAngle > 180) {
    realAngle -= 360;
  }

  return realAngle;
}

const compassHeading = (alpha, beta, gamma) => {
  // Convert degrees to radians
  const alphaRad = alpha * (Math.PI / 180);
  const betaRad = beta * (Math.PI / 180);
  const gammaRad = gamma * (Math.PI / 180);

  // Calculate equation components
  const cA = Math.cos(alphaRad);
  const sA = Math.sin(alphaRad);
  const cB = Math.cos(betaRad);
  const sB = Math.sin(betaRad);
  const cG = Math.cos(gammaRad);
  const sG = Math.sin(gammaRad);

  // Calculate A, B, C rotation components
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;
  const rC = -cB * cG;

  // Calculate compass heading
  let compassHeading = Math.atan(rA / rB);

  // Convert from half unit circle to whole unit circle
  if (rB < 0) {
    compassHeading += Math.PI;
  } else if (rA < 0) {
    compassHeading += 2 * Math.PI;
  }

  // Convert radians to degrees
  compassHeading *= 180 / Math.PI;

  return compassHeading;
};
//내가 계산한 각도, 실제각도 비교
