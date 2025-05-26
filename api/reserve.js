let recentSubmissions = []; // 簡易メモリ

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, date, token } = req.body;

  if (!name || !email || !date || !token) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET;
  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  const recaptchaRes = await fetch(verificationUrl, { method: 'POST' });
  const recaptchaData = await recaptchaRes.json();

  if (!recaptchaData.success || recaptchaData.score < 0.5) {
    return res.status(403).json({ message: 'reCAPTCHA failed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  const now = Date.now();
  const TIME_LIMIT = 60 * 1000; // 1分以内の再送信をブロック

  const found = recentSubmissions.find(entry =>
    entry.ip === ip &&
    entry.name === name &&
    entry.email === email &&
    entry.date === date &&
    now - entry.timestamp < TIME_LIMIT
  );

  if (found) {
    return res.status(429).json({ message: '連続送信は禁止されています。時間をおいてください。' });
  }

  recentSubmissions.push({ ip, name, email, date, timestamp: now });
  recentSubmissions = recentSubmissions.filter(entry => now - entry.timestamp < TIME_LIMIT);

  console.log('新しい予約:', { ip, name, email, date });

  return res.status(200).json({ message: '予約を受け付けました！' });
}
