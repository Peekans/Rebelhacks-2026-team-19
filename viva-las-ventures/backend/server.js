import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

let conversationHistory = [
  { role: 'system', content: 'You\'re an assistant that is helping to plan a Las Vegas itinerary plan.' }
];


const openai = new OpenAI({
    baseURL: 'https://api.featherless.ai/v1',
     apiKey: 'rc_cbd191359c10aa61c1c4ab4d6a4d3c62334ee513f7c5fc47b58a7eebd8a56855' 
    });

app.post('/api/chat', async (req, res) => {
    
  const { message } = req.body;

  console.log(message)
  try {
    conversationHistory.push({ role: 'user', content: message });
    console.log(conversationHistory)
    const completion = await openai.chat.completions.create({
    
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: conversationHistory,
    });
    console.log('OpenAI response:', completion.choices[0].message.content); // debug
    conversationHistory.push({ role: 'assistant', content: completion.choices[0].message.content  });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'Error generating response' });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));