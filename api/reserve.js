// グローバルなメモリキャッシュ（Vercelでは1リクエストごとにリセットされる）
const ipCache = new Map();

export default function handler(req, res) {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    'unknown';

  const now = Date.now();
  const lastAccess = ipCache.get(ip);

  if (lastAccess && now - lastAccess < 60 * 60 * 1000) {
    return res.status(429).json({
      message: 'このIPアドレスからは1時間に1回のみ予約できます',
    });
  }

  ipCache.set(ip, now);

  // フロントエンドから送られてきたデータ
  const { name, date, time } = req.body;

  // 簡易ログ（実際はDBなどに保存）
  console.log(`[予約] IP: ${ip}, 名前: ${name}, 日時: ${date} ${time}`);

  return res.status(200).json({
    message: '予約を受け付けました',
  });
}
