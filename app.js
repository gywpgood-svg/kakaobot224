console.log("🔥 최신 코드 실행됨");

const express = require("express");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());

/* ============================= */
/* ✅ 환경변수 */
/* ============================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SALT = process.env.HASH_SALT;
const ADMIN_KEY = process.env.ADMIN_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================= */
/* ✅ 해시 함수 */
/* ============================= */

function hashUser(user_id) {
  return crypto
    .createHash("sha256")
    .update(user_id + SALT)
    .digest("hex");
}

/* ============================= */
/* ✅ 서버 확인 */
/* ============================= */

app.get("/", (req, res) => {
  res.send("✅ 서버 정상 작동중");
});

/* ============================= */
/* ✅ 🔥 일반 이벤트 저장 (/event) */
/* ============================= */

app.post("/event", async (req, res) => {
  try {
    const { type, room, user_id, nickname } = req.body;

    if (!type || !room || !user_id || !nickname)
      return res.status(400).json({ error: "필수값 누락" });

    const hashed = hashUser(user_id);

    const { error } = await supabase.from("events").insert([
      {
        type,
        room,
        user_id: hashed,
        nickname,
      },
    ]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /event 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */
/* ✅ JOIN 이벤트 */
/* ============================= */

app.post("/join", async (req, res) => {
  try {
    const { room, user_id, nickname } = req.body;

    if (!room || !user_id || !nickname)
      return res.status(400).json({ error: "필수값 누락" });

    const hashed = hashUser(user_id);

    const { error } = await supabase.from("events").insert([
      {
        type: "join",
        room,
        user_id: hashed,
        nickname,
      },
    ]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /join 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */
/* ✅ 닉네임 변경 자동 기록 */
/* ============================= */

app.post("/nick-change", async (req, res) => {
  try {
    const { room, user_id, old_nick, new_nick } = req.body;

    if (!room || !user_id || !old_nick || !new_nick)
      return res.status(400).json({ error: "필수값 누락" });

    const hashed = hashUser(user_id);

    const { error } = await supabase.from("nick_history").insert([
      {
        room,
        user_id: hashed,
        old_nick,
        new_nick,
      },
    ]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /nick-change 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */
/* ✅ 사용자 삭제 */
/* ============================= */

app.post("/delete-user", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id)
      return res.status(400).json({ error: "user_id 필요" });

    const hashed = hashUser(user_id);

    await supabase.from("events").delete().eq("user_id", hashed);
    await supabase.from("nick_history").delete().eq("user_id", hashed);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ /delete-user 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */
/* ✅ 관리자 로그 조회 */
/* ============================= */

app.get("/admin/logs", async (req, res) => {
  try {
    const key = req.query.key;

    if (key !== ADMIN_KEY)
      return res.status(403).json({ error: "권한 없음" });

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ /admin/logs 에러:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */
/* ✅ 서버 실행 */
/* ============================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 서버 실행중:", PORT);
});
