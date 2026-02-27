require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "있음" : "없음");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// 🔹 Supabase 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 기본 확인용
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중");
});

// 🔹 /join 라우트
app.post("/join", async (req, res) => {
  console.log("🔥 /join 요청 들어옴");
  console.log("Body:", req.body);

  try {
    const { room, name } = req.body;

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("name", name)
      .single();

    if (!existing) {
      await supabase.from("users").insert({
        name: name,
        room: room,
        join_count: 1
      });
      console.log("✅ 신규 유저 저장");
    } else {
      await supabase
        .from("users")
        .update({ join_count: existing.join_count + 1 })
        .eq("name", name);
      console.log("🔁 기존 유저 업데이트");
    }

    res.json({ success: true });

  } catch (err) {
    console.log("❌ 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 서버 실행 중, 포트:", PORT);
});
