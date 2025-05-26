let recentSubmissions = []; // 簡易メモリ（IP & 内容 & 時刻）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, date, token } = req.body;

  if (!name || !date || !token) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // reCAPTCHAの検証
  const secretKey = process.env.RECAPTCHA_SECRET;
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  const recaptchaRes = await fetch(verificationUrl, { method: 'POST' });
  const recaptchaData = await recaptchaRes.json();

  if (!recaptchaData.success || recaptchaData.score < 0.5) {
    return res.status(403).json({ message: 'reCAPTCHA failed' });
  }

  // 🔐 IPアドレス取得（Vercel環境対応）
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;

  // 🔄 重複チェック
  const now = Date.now();
  const TIME_LIMIT = 60 * 1000; // 1分以内の再送信をブロック

  // 同一IPかつ同一内容の直近送信を確認
  const found = recentSubmissions.find(entry =>
    entry.ip === ip &&
    entry.name === name &&
    entry.date === date &&
    now - entry.timestamp < TIME_LIMIT
  );

  if (found) {
    return res.status(429).json({ message: '連続送信は禁止されています。時間をおいてください。' });
  }

  // 新しい送信を記録
  recentSubmissions.push({ ip, name, date, timestamp: now });

  // メモリの古いデータを削除（軽量化）
  recentSubmissions = recentSubmissions.filter(entry => now - entry.timestamp < TIME_LIMIT);

  // 📝 実際の予約処理（Vercelログに記録）
  console.log('新しい予約:', { ip, name, date });

  return res.status(200).json({ message: '予約を受け付けました！' });
}
