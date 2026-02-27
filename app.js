require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

// ==============================
// 🔹 Supabase 연결
// ==============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==============================
// 🔹 서버 상태 확인
// ==============================
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중");
});


// =====================================================
// 1️⃣ 가입 API
// =====================================================
app.post("/가입하다", async (req, res) => {
  try {
    const { 이름, 방 } = req.body;

    if (!이름 || !방) {
      return res.status(400).json({ 오류: "이름 또는 방 누락" });
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
    } else {
      await supabase
        .from("사용자")
        .update({ join_count: 기존.join_count + 1 })
        .eq("이름", 이름);
    }

    res.json({ 성공: true });

  } catch (err) {
    res.status(500).json({ 오류: err.message });
  }
});


// =====================================================
// 2️⃣ 사용자 기록 API
// =====================================================
app.post("/사용자_기록", async (req, res) => {
  try {
    const { 카카오_id, 닉네임 } = req.body;

    if (!카카오_id || !닉네임) {
      return res.status(400).json({ 오류: "값이 부족함" });
    }

    const { error } = await supabase
      .from("users")
      .update({ current_nickname: 닉네임 })
      .eq("kakao_id", 카카오_id);

    if (error) {
      return res.status(500).json({ 오류: error.message });
    }

    res.json({ 성공: true });

  } catch (err) {
    res.status(500).json({ 오류: "서버 오류" });
  }
});


// =====================================================
// 3️⃣ 닉네임 자동 동기화 API
// =====================================================
app.post("/user-sync", async (req, res) => {
  try {
    const { kakao_id, nickname } = req.body;

    if (!kakao_id || !nickname) {
      return res.status(400).json({ error: "값이 부족함" });
    }

    const { error } = await supabase
      .from("users")
      .upsert(
        {
          kakao_id,
          current_nickname: nickname
        },
        { onConflict: "kakao_id" }
      );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});


// =====================================================
// 4️⃣ 🔥 입장 / 퇴장 기록 API 추가
// =====================================================
app.post("/join-leave", async (req, res) => {
  try {
    const { kakao_id, nickname, type } = req.body;

    if (!kakao_id || !nickname || !type) {
      return res.status(400).json({ error: "값 부족" });
    }

    const { error } = await supabase
      .from("join_leave_history")
      .insert({
        kakao_id,
        nickname,
        type
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "서버 오류" });
  }
});


// =====================================================
// 5️⃣ 닉네임 변경 기록 조회 API
// =====================================================
app.get("/nickname-history/:kakao_id", async (req, res) => {
  try {
    const { kakao_id } = req.params;

    const { data, error } = await supabase
      .from("nickname_history")
      .select("*")
      .eq("kakao_id", kakao_id)
      .order("changed_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
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
