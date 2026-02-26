require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 기본 페이지
app.get('/', (req, res) => {
  res.send('서버 정상 작동중');
});

// DB 연결 테스트
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    return res.status(500).json({ error });
  }
  res.json({ success: true, data });
});

// 입장 API
app.post('/join', async (req, res) => {
  const { kakao_id } = req.body;

  // 입장 기록
  await supabase.from('join_leave_history').insert([
    { kakao_id, type: 'join', created_at: new Date() }
  ]);

  // 유저 상태 업데이트
  await supabase
    .from('users')
    .update({ is_active: true })
    .eq('kakao_id', kakao_id);

  res.json({ success: true });
});

// 퇴장 API
app.post('/leave', async (req, res) => {
  const { kakao_id } = req.body;

  // 퇴장 기록
  await supabase.from('join_leave_history').insert([
    { kakao_id, type: 'leave', created_at: new Date() }
  ]);

  // 유저 상태 업데이트
  await supabase
    .from('users')
    .update({ is_active: false })
    .eq('kakao_id', kakao_id);

  res.json({ success: true });
});

// 입장/퇴장 히스토리 조회 API
app.get('/join-history', async (req, res) => {
  const { kakao_id } = req.query;

  const { data: logs, error } = await supabase
    .from('join_leave_history')
    .select('*')
    .eq('kakao_id', kakao_id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error });
  }

  res.json({ logs });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행중: ${PORT}`);
});
