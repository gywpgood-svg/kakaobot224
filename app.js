const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 루트 확인용 (이게 있어야 화면에 글자 나옴)
app.get("/", (req, res) => {
  res.send("서버 정상 작동중 🔥");
});

// 테스트용 API
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 반드시 이렇게 해야 Render에서 정상 작동
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
