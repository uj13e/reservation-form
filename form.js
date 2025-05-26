document.getElementById('reservationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const token = await grecaptcha.execute('あなたのサイトキー', { action: 'submit' });
  form.querySelector('#recaptchaToken').value = token;

  const formData = new FormData(form);
  const email = formData.get('email');
  const datetime = formData.get('datetime');

  const cookieKey = `reserved_${email}_${datetime}`;
  if (document.cookie.includes(cookieKey)) {
    alert('すでにこの日時に予約されています。');
    return;
  }

  const res = await fetch('/api/reserve.js', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(formData)),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  alert(data.message);

  document.cookie = `${cookieKey}=1; max-age=86400`;
});
