const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Supabase 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

//////////////////////////////////////////////////////
// ✅ 닉네임 동기화 API
//////////////////////////////////////////////////////
app.post("/user-sync", async (req, res) => {
  try {
    const { kakao_id, nickname } = req.body;

    if (!kakao_id || !nickname) {
      return res.status(400).json({ error: "값 부족" });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("kakao_id", kakao_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("users").insert({
        kakao_id,
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
        .eq("kakao_id", kakao_id);

      return res.json({ nicknameChanged: true });
    }

    return res.json({ noChange: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//////////////////////////////////////////////////////
// ✅ 입장 / 퇴장 처리 API (최종 안정 버전)
//////////////////////////////////////////////////////
app.post("/join-leave", async (req, res) => {
  try {
    const { kakao_id, nickname, type } = req.body;

    if (!kakao_id || !nickname || !type) {
      return res.status(400).json({ error: "값 부족" });
    }

    // 1️⃣ 로그 테이블 기록
    await supabase.from("join_leave_logs").insert({
      kakao_id,
      nickname,
      type
    });

    // 2️⃣ 기존 유저 조회
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("kakao_id", kakao_id)
      .maybeSingle();

    // 3️⃣ 유저가 아예 없으면 생성
    if (!user) {
      await supabase.from("users").insert({
        kakao_id,
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
        .eq("kakao_id", kakao_id);

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
        .eq("kakao_id", kakao_id);

      return res.json({ leaveRecorded: true });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//////////////////////////////////////////////////////
// 서버 실행
//////////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("서버 실행중:", PORT);
});
