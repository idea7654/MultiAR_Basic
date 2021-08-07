import * as THREE from "https://unpkg.com/three/build/three.module.js";
import { ColladaLoader } from "https://threejs.org/examples/jsm/loaders/ColladaLoader.js";

let renderer = null;
let scene = null;
let camera = null;

let gps = null;
let compassDegree = null;
let watch = null;
let sortArr = [];
let playerVector = null;
let model = null;
let setFlag = true;
let pivot = null;
let controller = null;

let builtInfo = null;

document.getElementById("overlay").style.visibility = "hidden";

const initScene = (gl, session) => {
  //-- scene, camera(threeJs의 카메라, 씬 설정)
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  //---

  //--- light(빛 설정, 빛 설정을 하지 않으면 오브젝트가 검정색으로밖에 보이지 않는다)
  const light = new THREE.PointLight(0xffffff, 2, 100); // soft white light
  scene.add(light);
  //---
  // create and configure three.js renderer with XR support
  //XR을 사용하기 위해 threeJs의 renderer를 만들고 설정
  renderer = new THREE.WebGLRenderer({
    antialias: true, //위신호 제거
    alpha: true, //캔버스에 알파(투명도)버퍼가 있는지 여부
    autoClear: true, //프레임을 렌더링하기 전에 출력을 자동적으로 지우는지 여부
    context: gl, //기존 RenderingContext에 렌더러를 연결(gl)
  });

  const loader = new ColladaLoader();
  loader.load("model2.dae", (collada) => {
    const box = new THREE.Box3().setFromObject(collada.scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    collada.scene.position.set(-c.x, size.y / 2 - c.y, -c.z);
    collada.scene.scale.set(0.5, 0.5, 0.5);
    model = new THREE.Object3D();
    model.add(collada.scene);

    pivot = new THREE.Object3D();
    pivot.position.set(0, 0, 0);
    pivot.add(model);
  });

  controller = renderer.xr.getController(0);
  renderer.setPixelRatio(window.devicePixelRatio); //장치 픽셀 비율 설정
  renderer.setSize(window.innerWidth, window.innerHeight); //사이즈 설정
  renderer.xr.enabled = true; //renderer로 xr을 사용할지 여부
  renderer.xr.setReferenceSpaceType("local"); //
  renderer.xr.setSession(session);
  document.body.appendChild(renderer.domElement);
  //---
};

// AR세션을 시작하는 버튼
const xrButton = document.getElementById("xr-button");
// xrSession
let xrSession = null;
// xrReferenceSpace
let xrRefSpace = null;

//렌더링을 위한 캔버스 OpenGL 컨텍스트
let gl = null;

function checkXR() {
  if (!window.isSecureContext) {
    //WebXR은 https환경에서만 사용가능.
    document.getElementById("warning").innerText =
      "WebXR unavailable. Please use secure context";
  }
  if (navigator.xr) {
    //navigator.xr을 지원하는지 여부
    navigator.xr.addEventListener("devicechange", checkSupportedState);
    checkSupportedState();
  } else {
    document.getElementById("warning").innerText =
      "WebXR unavailable for this browser";
  }
}

function checkSupportedState() {
  navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
    //ArCore를 지원하는 디바이스의 크롬 브라우저인지 여부
    if (supported) {
      xrButton.innerHTML = "Enter AR";
      xrButton.addEventListener("click", onButtonClicked);
    } else {
      xrButton.innerHTML = "AR not found";
    }
    xrButton.disabled = !supported;
  });
}

function onButtonClicked() {
  if (!xrSession) {
    navigator.xr
      .requestSession("immersive-ar", {
        //세션요청
        //optionalFeatures: ['dom-overlay'], //옵션(ex: dom-overlay, hit-test 등)
        //requiredFeatures: ['unbounded', 'hit-test'], //필수옵션
        //domOverlay: {
        //    root: document.getElementById('overlay')
        //} //dom-overlay사용시 어떤 요소에 적용할 것인지 명시
      })
      .then(onSessionStarted, onRequestSessionError);
  } else {
    xrSession.end();
  }
}

function onSessionStarted(session) {
  //세션요청을 성공하면 session값이 반환됨
  xrSession = session;
  xrButton.innerHTML = "Exit AR";

  if (session.domOverlayState) {
    info.innerHTML = "DOM Overlay type: " + session.domOverlayState.type; //session의 dom overlay타입 명시. Ar환경에서는
  }

  // create a canvas element and WebGL context for rendering
  //렌더링을 위한 캔버스 요소와 WebGL 컨텍스트를 만듬
  session.addEventListener("end", onSessionEnded);
  let canvas = document.createElement("canvas"); //HTML5 Canvas
  gl = canvas.getContext("webgl", {
    xrCompatible: true,
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl),
  }); //세션의 레이어 설정

  // here we ask for viewer reference space, since we will be casting a ray
  // from a viewer towards a detected surface. The results of ray and surface intersection
  session.requestReferenceSpace("viewer").then((refSpace) => {
    xrRefSpace = refSpace;
    //xrRefSpace -> viewer ReferenceSpace
    session.requestAnimationFrame(onXRFrame);
    //onXRFrame을 호출
  });

  // three.js의 씬을 초기화
  initScene(gl, session);
}

function onRequestSessionError(ex) {
  info.innerHTML = "Failed to start AR session.";
  console.error(ex.message);
}

function onSessionEnded(event) {
  //세션을 끝냈을때
  xrSession = null;
  xrButton.innerHTML = "Enter AR";
  info.innerHTML = "";
  gl = null;
}

function getGPS() {
  window.addEventListener("deviceorientationabsolute", handleMotion, true);
  function success(position) {
    gps = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };

    const dlat = builtInfo.lat - gps.lat;
    const dlon = builtInfo.lon - gps.lon;

    const distance = Math.sqrt(dlat * dlat + dlon * dlon);
    const angle = (Math.atan2(dlat, dlon) * 180) / Math.PI;
    let realAngle = 0;
    if (angle < 0) {
      realAngle = 360 - compassDegree - 20 + 360 + angle;
    } else {
      realAngle = 360 - compassDegree - 20 + angle;
    }
    if (realAngle > 360) {
      realAngle -= 360;
    }
    realAngle -= 180;

    if (model) {
      model.position.set(0, -0.5, -3).applyMatrix4(controller.matrixWorld);
      model.quaternion.setFromRotationMatrix(controller.matrixWorld);
      model.rotateX(Math.PI);
      const pivotClone = pivot.clone();
      // const canvas1 = document.createElement("canvas");
      // const context1 = canvas1.getContext("2d");
      //context1.font = "Bold 10px Arial";
      //context1.fillStyle = "rgba(0, 0, 0, 1)";
      //context1.fillText(data.name, 0, 60);

      // const texture1 = new THREE.Texture(canvas1);
      // texture1.needsUpdate = true;
      // const material1 = new THREE.MeshBasicMaterial({
      //   map: texture1,
      //   side: THREE.DoubleSide,
      // });
      // material1.transparent = true;

      // const mesh1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material1);
      // mesh1.position.set(0.5, -0.3, -2).applyMatrix4(controller.matrixWorld);
      // mesh1.quaternion.setFromRotationMatrix(controller.matrixWorld);
      // pivotClone.add(mesh1);
      pivotClone.rotateY((realAngle * Math.PI) / 180);
      scene.add(pivotClone);
      navigator.geolocation.clearWatch(watch);
    }
  }

  function error() {
    alert("error");
  }
  const options = {
    enableHighAccuracy: true,
    maximumAge: 300000,
    timeout: 27000,
  };
  watch = navigator.geolocation.watchPosition(success, error, options);
}

function handleMotion(event) {
  const compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);
  compassDegree = Math.ceil(compass);
  //    navigator.geolocation.clearWatch(watch);
  //const div = document.getElementById("artInfo");
  //div.style.visibility = "visible";
  //div.innerHTML = `gyro: ${compassDegree}`;
}

function updateAnimation() {
  //threeJs의 오브젝트들의 애니메이션을 넣는 곳
  //   if (playerVector && model && setFlag && sortArr.length !== 0) {
  //     setFlag = false;
  //   }
}

function onXRFrame(t, frame) {
  let session = frame.session; //매 프레임의 session
  let xrViewerPose = frame.getViewerPose(xrRefSpace); //xrViewerPose
  if (xrViewerPose) {
    const viewPos = xrViewerPose.views[0].transform.position;
    playerVector = new THREE.Vector3(viewPos.x, viewPos.y, viewPos.z);
  }
  session.requestAnimationFrame(onXRFrame); //onXRFrame을 반복 호출

  updateAnimation();
  //WebXr로 생성된 gl 컨텍스트를 threeJs 렌더러에 바인딩
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  //threeJs의 씬을 렌더링
  renderer.render(scene, camera);
}

checkXR(); //브라우저가 로딩되면 checkXR을 실행
getGPS();

document.getElementById("built_p").addEventListener("click", () => {
  axios.get("http://127.0.0.1:3000/built/0").then((res) => {
    //console.log(res.data);
    builtInfo = res.data;
    document.getElementById("overlay").style.visibility = "visible";
    document.getElementById("result").innerHTML = document.getElementById(
      "built_p"
    ).text;
  });
});

document.getElementById("built_c").addEventListener("click", () => {
  axios.get("http://127.0.0.1:3000/built/24").then((res) => {
    // console.log(res.data);
    builtInfo = res.data;
    document.getElementById("overlay").style.visibility = "visible";
    document.getElementById("result").innerHTML = document.getElementById(
      "built_c"
    ).text;
  });
});

document.getElementById("major_japan").addEventListener("click", () => {
  axios.get("http://127.0.0.1:3000/major/3").then((res) => {
    // console.log(res.data);
    builtInfo = res.data;
    document.getElementById("overlay").style.visibility = "visible";
    document.getElementById("result").innerHTML = document.getElementById(
      "major_japan"
    ).text;
  });
});

document.getElementById("major_game").addEventListener("click", () => {
  axios.get("http://127.0.0.1:3000/major/27").then((res) => {
    //console.log(res.data);
    builtInfo = res.data;
    document.getElementById("overlay").style.visibility = "visible";
    document.getElementById("result").innerHTML = document.getElementById(
      "major_game"
    ).text;
  });
});
