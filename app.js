const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 루트 확인
app.get("/", (req, res) => {
  res.send("서버 정상 작동중 🔥");
});

// 입장/퇴장 이벤트 저장
app.post("/event", async (req, res) => {
  const { type, room, name, time } = req.body;

  await supabase.from("events").insert([
    { type, room, name, time }
  ]);

  res.json({ success: true });
});

// 히스토리 조회
app.get("/history", async (req, res) => {
  const room = req.query.room;

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("room", room)
    .order("time", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) {
    return res.send("기록 없음");
  }

  let text = "📜 최근 히스토리\n\n";
  data.forEach(d => {
    text += `${d.type === "join" ? "입장" : "퇴장"} - ${d.name}\n`;
  });

  res.send(text);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
