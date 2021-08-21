const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync("./privkey.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
const cookieParser = require("cookie-parser");

var markers = [];
var marker = { id: null, gps: { lat: null, lon: null } };
marker = {
  id: "yfkgj",
  gps: { lat: 36.32194760415595, lon: 127.36717672654622 },
};
markers.push(marker);
// const count = markers.push({
//   id: "yfkgj",
//   lat: 36.32194760415595,
//   lon: 127.36717672654622,
// }); //p관
// console.log(count);

app.use(cors({ credentials: true }));

app.use(
  cookieParser(process.env.COOKIE_SECRET, { sameSite: "none", secure: true })
);

const server = https.createServer(options, app).listen(8500);
// const server = app.listen(8500);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("sendGPS", (data) => {
    const isUser = markers.findIndex((i) => i.id == data.id);
    if (isUser == -1 && markers.length < 2) {
      markers.push(data);
      //console.log(markers);
      console.log(markers);
    } else {
      markers[isUser] = data;
    }
    io.emit("sendMarkers", markers);
  });

  socket.on("disconnect", () => {
    //디스커넥트...
    //io.emit()
    const index = markers.findIndex((i) => i.id == socket.id);
    markers.splice(index, 1);
    io.emit("sendMarkers", markers);
  });
});
