async function login() {
  const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: 'felipe@obracontrol.com.br',
      password: 'Admin@123',
      redirect: 'false'
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}
login();
