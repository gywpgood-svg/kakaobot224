const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

/* ✅ Supabase 연결 (방법1 기준) */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* 루트 확인 */
app.get("/", (req, res) => {
  res.send("서버 정상 작동중 🔥");
});

/* 입장/퇴장 이벤트 저장 */
app.post("/event", async (req, res) => {
  try {
    const { type, room, name, time } = req.body;

    const { error } = await supabase
      .from("events")
      .insert([{ type, room, name, time }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 히스토리 조회 */
app.get("/history", async (req, res) => {
  try {
    const room = req.query.room;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("room", room)
      .order("time", { ascending: false })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.send("기록 없음");
    }

    let text = "📜 최근 히스토리\n\n";
    data.forEach(d => {
      text += `${d.type === "join" ? "입장" : "퇴장"} - ${d.name}\n`;
    });

    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DB 연결 테스트용 */
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .limit(1);

  if (error) {
    return res.json({ error: error.message });
  }

  res.json({ success: true, data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
