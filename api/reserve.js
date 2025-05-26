export default function handler(req, res) {
  if (req.method === "POST") {
    const { name, date, time } = req.body;

    console.log("予約情報:", { name, date, time });

    // 実際の保存はここで行う（DBや外部サービス）
    res.status(200).json({ message: `${name}さんの予約を ${date} の ${time} に受け付けました。` });
  } else {
    res.status(405).json({ message: "POSTメソッドのみ対応しています。" });
  }
}
