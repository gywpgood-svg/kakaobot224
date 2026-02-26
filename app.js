const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ 서버 상태 확인
app.get('/', (req, res) => {
  res.send('서버 정상 작동중');
});

// ✅ DB 연결 테스트
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    return res.status(500).json({ error });
  }

  res.json({ success: true, data });
});

// ✅ 닉네임 변경 API
app.post('/change-nickname', async (req, res) => {
  try {
    const { user_id, new_nickname } = req.body;

    if (!user_id || !new_nickname) {
      return res.status(400).json({ error: '필수값 누락' });
    }

    // 기존 유저 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: '유저 없음' });
    }

    const now = new Date();

    // 7일 제한 체크 (last_seen 기준)
    const lastChange = user.last_seen;
    const diffDays =
      (now - new Date(lastChange)) / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      return res.status(400).json({ error: '7일 후에 변경 가능' });
    }

    // 히스토리 업데이트
    const updatedHistory = [
      ...(user.nickname_history || []),
      {
        nickname: user.current_nickname,
        changed_at: now
      }
    ];

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_nickname: new_nickname,
        last_nickname: user.current_nickname,
        nickname_history: updatedHistory,
        last_seen: now
      })
      .eq('id', user_id);

    if (updateError) {
      return res.status(500).json({ error: '업데이트 실패' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행중: ${PORT}`);
});
