import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
let recentSubmissions = []; // 簡易メモリキャッシュでの重複チェック

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name, email, date, token } = req.body;

    if (!name || !email || !date || !token) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // reCAPTCHA v3 検証
    const secretKey = process.env.RECAPTCHA_SECRET;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const recaptchaRes = await fetch(verificationUrl, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(403).json({ message: 'reCAPTCHA に失敗しました。' });
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const TIME_LIMIT = 60 * 1000; // 1分以内の重複送信をブロック

    // メモリ内の重複チェック
    const found = recentSubmissions.find(entry =>
      entry.ip === ip &&
      entry.name === name &&
      entry.email === email &&
      entry.date === date &&
      now - entry.timestamp < TIME_LIMIT
    );

    if (found) {
      return res.status(429).json({ message: '短時間での重複送信は禁止されています。' });
    }

    // Supabase 側でも email + date の重複チェック
    const { data: existing, error: checkError } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', email)
      .eq('date', date);

    if (checkError) {
      console.error('予約チェックエラー:', checkError);
      return res.status(500).json({ message: '予約状況の確認に失敗しました。' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'すでに同じ日付で予約があります。' });
    }

    // DBに挿入
    const { error: insertError } = await supabase.from('reservations').insert([
      { name, email, date, ip } // created_at は Supabase 側で設定可能
    ]);

    if (insertError) {
      console.error('挿入エラー:', insertError);
      return res.status(500).json({ message: '予約の保存に失敗しました。' });
    }

    // メモリキャッシュを更新
    recentSubmissions.push({ ip, name, email, date, timestamp: now });
    recentSubmissions = recentSubmissions.filter(entry => now - entry.timestamp < TIME_LIMIT);

    return res.status(200).json({ message: '✅ ご予約を受け付けました。' });

  } catch (err) {
    console.error('サーバーエラー:', err);
    return res.status(500).json({ message: '内部サーバーエラーが発生しました。' });
  }
}
