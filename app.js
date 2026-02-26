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
