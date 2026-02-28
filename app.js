require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

/* ============================= */
/* ✅ Supabase 연결 */
/* ============================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ============================= */
/* ✅ 기본 확인용 */
/* ============================= */
app.get("/", (req, res) => {
  res.send("✅ 서버 정상 작동 중입니다.");
});

app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "pong 🏓" });
});

/* ============================= */
/* ✅ 입장 이벤트 */
/* ============================= */
app.post("/join", async (req, res) => {
  const { room, name } = req.body;

  if (!room || !name)
    return res.status(400).json({ error: "room, name 필요" });

  const { error } = await supabase.from("events").insert([
    { type: "join", room, name }
  ]);

  if (error) return res.status(500).json({ error });

  res.json({ success: true });
});

/* ============================= */
/* ✅ 퇴장 이벤트 */
/* ============================= */
app.post("/leave", async (req, res) => {
  const { room, name } = req.body;

  if (!room || !name)
    return res.status(400).json({ error: "room, name 필요" });

  const { error } = await supabase.from("events").insert([
    { type: "leave", room, name }
  ]);

  if (error) return res.status(500).json({ error });

  res.json({ success: true });
});

/* ============================= */
/* ✅ 유저 삭제 */
/* ============================= */
app.post("/delete-user", async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ error: "name 필요" });

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("name", name);

  if (error) return res.status(500).json({ error });

  res.json({ success: true });
});

/* ============================= */
/* ✅ 서버 실행 */
/* ============================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 서버 실행 중:", PORT);
});
