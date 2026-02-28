console.log("🔥 최신 코드 실행됨");
require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// ===============================
// 🔐 Supabase 연결
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ===============================
// 🔑 유저 해시 함수 (고정 식별용)
// ===============================
function hashUser(nickname) {
  return crypto
    .createHash("sha256")
    .update(nickname)
    .digest("hex");
}

// ===============================
// 🟢 기본 확인용
// ===============================
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ===============================
// 📌 이벤트 수신 API
// ===============================
app.post("/event", async (req, res) => {
  try {
    const { type, room, nickname } = req.body;

    if (!type || !room || !nickname) {
      return res.status(400).json({ error: "필수값 누락" });
    }

    const hashed = hashUser(nickname);

    const { error } = await supabase.from("events").insert([
      {
        type: type,
        room: room,
        nickname: nickname,
        user_id: hashed
      },
    ]);
// ===============================
// 📄 이벤트 전체 조회 API
// ===============================
app.get("/events", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("time", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "조회 실패" });
  }
});
    if (error) {
      console.error("DB 오류:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ error: "서버 내부 오류" });
  }
});

// ===============================
// 🗑 특정 유저 로그 삭제 API
// ===============================
app.delete("/delete/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("user_id", user_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "삭제 실패" });
  }
});

// ===============================
// 🚀 서버 실행
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
