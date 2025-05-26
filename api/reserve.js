let reservations = []; // ⚠ メモリ上のみ。Vercelでは再起動で消える

export default function handler(req, res) {
  if (req.method === "POST") {
    const { name, date, time } = req.body;

    const isDuplicate = reservations.some(r => r.date === date && r.time === time);
    if (isDuplicate) {
      res.status(409).json({
        success: false,
        message: `⚠️ すでに ${date} の ${time} に予約があります。`,
      });
      return;
    }

    // 登録
    reservations.push({ name, date, time });
    console.log("現在の予約:", reservations);

    res.status(200).json({
      success: true,
      message: `✅ ${name} さんの予約を ${date} の ${time} に受け付けました！`,
    });
  } else {
    res.status(405).json({ success: false, message: "POSTメソッドのみ対応しています。" });
  }
}
