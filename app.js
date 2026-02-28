app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다.");
});
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

// 🔹 SHA-256 재해시 함수
const hashKakaoId = (id) => {
  return crypto.createHash("sha256").update(id).digest("hex");
};

//////////////////////////////////////////////////////
// ✅ 입장 / 퇴장 처리 API (닉네임 저장 안함)
//////////////////////////////////////////////////////
app.post("/join-leave", async (req, res) => {
  try {
    const { kakao_id, type } = req.body;

    if (!kakao_id || !type) {
      return res.status(400).json({ error: "값 부족" });
    }

    const hashedKakaoId = hashKakaoId(kakao_id);

    // 1️⃣ 로그 기록 (닉네임 없음)
    await supabase.from("join_leave_logs").insert({
      kakao_id: hashedKakaoId,
      type: type
    });

    // 2️⃣ 기존 유저 조회
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("kakao_id", hashedKakaoId)
      .maybeSingle();

    // 3️⃣ 유저가 없으면 생성
    if (!user) {
      await supabase.from("users").insert({
        kakao_id: hashedKakaoId,
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

      // 재입장은 "이전에 입장 기록이 있었을 경우" 증가
      const newRejoinCount =
        newJoinCount > 1 ? (user.rejoin_count || 0) + 1 : 0;

      await supabase.from("users")
        .update({
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

//////////////////////////////////////////////////////
// ✅ 사용자 삭제 API
//////////////////////////////////////////////////////
app.post("/delete-user", async (req, res) => {
  try {
    const { kakao_id } = req.body;

    if (!kakao_id) {
      return res.status(400).json({ error: "kakao_id 필요" });
    }

    const hashedKakaoId = hashKakaoId(kakao_id);

    // users 삭제
    await supabase
      .from("users")
      .delete()
      .eq("kakao_id", hashedKakaoId);

    // 로그 삭제
    await supabase
      .from("join_leave_logs")
      .delete()
      .eq("kakao_id", hashedKakaoId);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//////////////////////////////////////////////////////
// ✅ 서버 실행
//////////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 서버 실행 중:", PORT);
});
