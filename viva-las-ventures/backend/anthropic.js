import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

app.post('/api/claude', async (req, res) => {
  const { userMessage, conversationHistory } = req.body;
  const messages = [...(conversationHistory || []), { role: 'user', content: userMessage }];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: 'You are a helpful Las Vegas travel assistant.',
      messages,
    }),
  });

  if (!response.ok) {
    return res.status(response.status).send(await response.text());
  }

  const data = await response.json();
  res.json({ text: data.content[0].text });
});

app.listen(3000, () => console.log('Server running on port 3000'));