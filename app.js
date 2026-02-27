require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// 🔹 Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 서버 상태 확인
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중");
});


// =====================================================
// 🔥 1️⃣ 기존 /join API (네가 쓰던 기능 유지)
// =====================================================
app.post("/join", async (req, res) => {
  try {
    const { 이름, 방 } = req.body;

    if (!이름 || !방) {
      return res.status(400).json({ error: "이름 또는 방 누락" });
    }

    const { data: 기존 } = await supabase
      .from("사용자")
      .select("*")
      .eq("이름", 이름)
      .single();

    if (!기존) {
      await supabase.from("사용자").insert({
        이름,
        방,
        join_count: 1
      });
      console.log("✅ 신규 사용자 생성");
    } else {
      await supabase
        .from("사용자")
        .update({ join_count: 기존.join_count + 1 })
        .eq("이름", 이름);
      console.log("🔄 기존 사용자 업데이트");
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ 오류:", err);
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// 🔥 2️⃣ 유저 자동 동기화 API (닉변 감지용)
// =====================================================
app.post("/user-sync", async (req, res) => {
  try {
    const { kakao_id, nickname } = req.body;

    if (!kakao_id || !nickname) {
      return res.status(400).json({ error: "값이 부족함" });
    }

    const { error } = await supabase
      .from("users")  // ⚠ 여기 테이블 이름 확인
      .upsert(
        {
          kakao_id: kakao_id,
          current_nickname: nickname
        },
        { onConflict: "kakao_id" }
      );

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});


// =====================================================
// 🚀 서버 실행
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 서버 실행 중, 포트:", PORT);
});
