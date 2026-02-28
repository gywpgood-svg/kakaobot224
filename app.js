require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Supabase 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 SHA-256 해시 함수
const hashKakaoId = (id) => {
  return crypto.createHash('sha256').update(id).digest('hex');
};

// =====================================================
// ✅ 닉네임 동기화 API
// =====================================================
app.post("/user-sync", async (req, res) => {
  try {
    const { kakao_id, nickname } = req.body;

    if (!kakao_id || !nickname) {
      return res.status(400).json({ error: "값 부족" });
    }

    const hashedKakaoId = hashKakaoId(kakao_id);  // 재해시 처리

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("kakao_id", hashedKakaoId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("users").insert({
        kakao_id: hashedKakaoId,
        current_nickname: nickname,
        total_join_count: 0,
        total_leave_count: 0,
        rejoin_count: 0
      });

      return res.json({ newUser: true });
    }

    if (existing.current_nickname !== nickname) {
      await supabase
        .from("users")
        .update({ current_nickname: nickname })
        .eq("kakao_id", hashedKakaoId);

      return res.json({ nicknameChanged: true });
    }

    return res.json({ noChange: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// =====================================================
// ✅ 입장 / 퇴장 처리 API
// =====================================================
app.post("/join-leave", async (req, res) => {
  try {
    const { kakao_id, nickname, type } = req.body;

    if (!kakao_id || !nickname || !type) {
      return res.status(400).json({ error: "값 부족" });
    }

    const hashedKakaoId = hashKakaoId(kakao_id);  // 재해시 처리

    // 1️⃣ 로그 테이블 기록
    await supabase.from("join_leave_logs").insert({
      kakao_id: hashedKakaoId,
      nickname: nickname,
      type: type
    });

    // 2️⃣ 기존 유저 조회
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("kakao_id", hashedKakaoId)
      .maybeSingle();

    // 3️⃣ 유저가 없으면 새로 생성
    if (!user) {
      await supabase.from("users").insert({
        kakao_id: hashedKakaoId,
        current_nickname: nickname,
        total_join_count: type === "join" ? 1 : 0,
        total_leave_count: type === "leave" ? 1 : 0,
        rejoin_count: 0,
        last_join_at: type === "join" ? new Date() : null,
        last_leave_at: type === "leave" ? new Date() : null
      });

      return res.json({
        firstJoin: type === "join"
      });
    }

    //////////////////////////////////////////////////
    // 🔹 입장 처리
    //////////////////////////////////////////////////
    if (type === "join") {

      const newJoinCount = (user.total_join_count || 0) + 1;
      const newRejoinCount =
        newJoinCount > 1 ? (user.rejoin_count || 0) + 1 : 0;

      await supabase.from("users")
        .update({
          current_nickname: nickname,
          total_join_count: newJoinCount,
          rejoin_count: newRejoinCount,
          last_join_at: new Date()
        })
        .eq("kakao_id", hashedKakaoId);

      return res.json({
        firstJoin: newJoinCount === 1,
        total_join_count: newJoinCount,
        rejoin_count: newRejoinCount
      });
    }

    //////////////////////////////////////////////////
    // 🔹 퇴장 처리
    //////////////////////////////////////////////////
    if (type === "leave") {

      const newLeaveCount = (user.total_leave_count || 0) + 1;

      await supabase.from("users")
        .update({
          total_leave_count: newLeaveCount,
          last_leave_at: new Date()
        })
        .eq("kakao_id", hashedKakaoId);

      return res.json({ leaveRecorded: true });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// =====================================================
// ✅ 사용자 삭제 API (삭제 요청 시)
///////////////////////////////////////////////////////
app.post("/delete-user", async (req, res) => {
  try {
    const { kakao_id } = req.body;

    if (!kakao_id) {
      return res.status(400).json({ error: "kakao_id가 필요합니다." });
    }

    const hashedKakaoId = hashKakaoId(kakao_id);  // 재해시 처리

    // 1️⃣ 유저 삭제 (users 테이블에서)
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("kakao_id", hashedKakaoId);

    if (deleteUserError) {
      return res.status(500).json({ error: deleteUserError.message });
    }

    // 2️⃣ 입장/퇴장 기록 삭제 (join_leave_logs 테이블에서)
    const { error: deleteLogsError } = await supabase
      .from("join_leave_logs")
      .delete()
      .eq("kakao_id", hashedKakaoId);

    if (deleteLogsError) {
      return res.status(500).json({ error: deleteLogsError.message });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// =====================================================
// ✅ 서버 실행
///////////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 서버 실행 중:", PORT);
});
