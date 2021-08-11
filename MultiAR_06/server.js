const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync("./privkey.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
const Major = [
  { name: "기독교사회복지학과", BuiltNum: 6 },
  { name: "국어국문한국어교육학과", BuiltNum: 18 },
  { name: "중국통상학과", BuiltNum: 0 },
  { name: "일본학과", BuiltNum: 0 },
  { name: "영어과", BuiltNum: 0 },
  { name: "스페인어&중남미학과", BuiltNum: 0 },
  { name: "경찰법학과", BuiltNum: 0 },
  { name: "행정학과", BuiltNum: 0 },
  { name: "심리상담학과", BuiltNum: 18 },
  { name: "유아교육과", BuiltNum: 30 },
  { name: "경영학과", BuiltNum: 0 },
  { name: "무역물류경영학과", BuiltNum: 0 },
  { name: "전자상거래학과", BuiltNum: 0 },
  { name: "관광경영학과", BuiltNum: 0 },
  { name: "호텔항공경영학과", BuiltNum: 0 },
  { name: "항공서비스학과", BuiltNum: 26 },
  { name: "바이오의약학부", BuiltNum: 20 },
  { name: "식품영양학과", BuiltNum: 20 }, //?
  { name: "원예삼림학과", BuiltNum: 20 },
  { name: "간호학과", BuiltNum: 22 },
  { name: "실버보건학과", BuiltNum: 7 },
  { name: "외식조리학과", BuiltNum: 20 },
  { name: "전자공학과", BuiltNum: 24 },
  { name: "전기공학과", BuiltNum: 20 },
  { name: "컴퓨터공학과", BuiltNum: 24 },
  { name: "인터넷소프트웨어공학", BuiltNum: 24 },
  { name: "정보보안학과", BuiltNum: 24 },
  { name: "게임공학과", BuiltNum: 24 },
  { name: "모바일소프트웨어학과", BuiltNum: 24 },
  { name: "드론&철도&건설시스템공학과", BuiltNum: 22 },
  { name: "신소재공학과", BuiltNum: 22 },
];
const Built = [
  { name: "21세기관(p관)", lat: 36.32194760415595, lon: 127.36717672654622 },
  "정문안내소",
  "버스정류소",
  "예술관(y관)",
  "킴스가든",
  "원예실습동(WG)",
  "아펜젤러기념관(AM관)", //6
  "국제교류관(G관)",
  "백산관(B관)",
  "테니스장 및 풋살장",
  "서재필관(F관)",
  "생할관(PA, PB)",
  "생활관(집현관)",
  "녹색나눔숲",
  "생활관(목련관)",
  "중앙도서관",
  "야외강당",
  "U-Story",
  "우남관(W관)", //18
  "아펜젤러관(A관)",
  "자연과학관(J관)",
  "하워드관(H관)",
  "미래창조관(MC관)",
  "타이거하우스(TH)",
  { name: "정보과학관(C관)", lat: 36.317563, lon: 127.367723 },
  "후문",
  "소월관(S관)",
  "김옥균관(학군단)",
  "자주로",
  "소월각",
  "하워드기념관(HM)",
  "SMART배재관(SP관)",
];

app.use(cors());
app.use(express.static("public"));

app.get("/built/:id", (req, res) => {
  //console.log(req.params.id);
  res.send(Built[req.params.id]);
});

app.get("/major/:id", (req, res) => {
  const builtNum = Major[req.params.id].BuiltNum;
  res.send(Built[builtNum]);
});

const server = https.createServer(options, app).listen(9000);
