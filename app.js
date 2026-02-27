app.post("/join", async (req, res) => {
  console.log("🔥 /join 요청 들어옴");
  console.log("Body:", req.body);

  try {
    const { room, name } = req.body;

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("name", name)
      .single();

    if (!existing) {
      await supabase.from("users").insert({
        name: name,
        room: room,
        join_count: 1
      });
      console.log("✅ 신규 유저 저장");
    } else {
      await supabase
        .from("users")
        .update({ join_count: existing.join_count + 1 })
        .eq("name", name);
      console.log("🔁 기존 유저 업데이트");
    }

    res.json({ success: true });

  } catch (err) {
    console.log("❌ 에러:", err);
    res.status(500).json({ error: err.message });
  }
});
