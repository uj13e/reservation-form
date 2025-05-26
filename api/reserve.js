export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, datetime, token } = req.body;

  // reCAPTCHAチェック
  const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
  });
  const captchaData = await captchaRes.json();

  if (!captchaData.success || captchaData.score < 0.5) {
    return res.status(400).json({ message: 'Botと判定されました。' });
  }

  // ログ記録（Vercel のログで確認）
  console.log('✅ 新規予約:', { name, email, datetime });

  res.status(200).json({ message: '予約を受け付けました！' });
}
