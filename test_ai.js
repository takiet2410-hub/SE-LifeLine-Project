const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { iss: 'lifeline-gateway', sub: 'ai-service', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 },
  'super-secret-local-dev-key',
  { algorithm: 'HS256', keyid: 'local-dev-key-1' }
);

async function test() {
  const res = await fetch('http://127.0.0.1:8000/api/v1/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      message: "Điều kiện hiến máu là gì?",
      donorContext: {},
      history: [],
      conversationId: "123",
      clientRequestId: "123"
    })
  });
  console.log(res.status, await res.text());
}
test();
