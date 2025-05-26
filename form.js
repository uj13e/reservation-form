document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.querySelector('#name')?.value.trim();
  const email = document.querySelector('#email')?.value.trim();
  const date = document.querySelector('#date')?.value;

  if (!name || !email || !date) {
    alert("名前、メールアドレス、日付を入力してください");
    return;
  }

  grecaptcha.ready(() => {
    grecaptcha.execute('6Ld9SUkrAAAAAIrAHTAhYNTvMPGc8ccHgEkDVAA3', { action: 'submit' }).then(async (token) => {
      if (!token) {
        alert("reCAPTCHA トークン取得に失敗しました");
        return;
      }

      console.log("送信データ:", { name, email, date, token });

      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, token }),
      });

      const data = await res.json();
      alert(data.message);
    });
  });
});
