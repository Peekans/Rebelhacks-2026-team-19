import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import 'dotenv/config'; 

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI Client
const openai = new OpenAI({
  baseURL: 'https://api.featherless.ai/v1',
  apiKey: process.env.FEATHERLESS_API_KEY 
});

// Ticketmaster Config
const TM_API_KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * THE AGENT TOOL: Fetches real-time events from Ticketmaster
 */
async function fetchLiveEvents() {
  const nowIso = new Date().toISOString().split('.')[0] + 'Z';
  const url = `${TM_BASE_URL}/events.json?apikey=${TM_API_KEY}&city=Las Vegas&stateCode=NV&size=5&sort=date,asc&startDateTime=${nowIso}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ticketmaster API error: ${response.status}`);
    const data = await response.json();
    return data?._embedded?.events || [];
  } catch (err) {
    console.error("Ticketmaster fetch failed:", err.message);
    return [];
  }
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // 1. Get the user's latest message
  const latestMessage = messages[messages.length - 1].content;
  const eventKeywords = /(event|show|concert|ticket|playing|tonight|happening|music)/i;
  let systemNote = "";

  // 2. THE AGENT BRAIN
  if (eventKeywords.test(latestMessage)) {
    console.log("Agent triggered: Fetching live Ticketmaster data...");
    const events = await fetchLiveEvents();
    
    if (events.length > 0) {
      const summaries = events.map(e => 
        `- ${e.name} at ${e._embedded?.venues?.[0]?.name || 'Unknown Venue'} on ${e.dates?.start?.localDate} at ${e.dates?.start?.localTime || 'TBD'}`
      ).join('\n');
      systemNote = `\n\n[SYSTEM NOTE: The user is asking about events. Only answer questions related to planning trips in Las Vegas. Here is the REAL-TIME Ticketmaster schedule for Las Vegas right now. Use this data to naturally recommend options:\n${summaries}]`;
    }
  }

  // 3. Construct the Master Prompt
  const systemPrompt = {
    role: 'system',
    content: "You are an expert Las Vegas concierge. Help plan itineraries." + systemNote
  };
  try {
    // Tell the browser and ALL cloud proxies to never buffer this stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform'); // Stop standard proxies
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Stop Nginx (used by Cloud IDEs)
    
    res.flushHeaders(); // FORCE Express to send headers immediately

    console.log(`\n[DEBUG] 1. Sending request to AI at ${new Date().toISOString()}`);

    // 4. Send to AI and ask for a STREAM
    const completion = await openai.chat.completions.create({
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [systemPrompt, ...messages],
      temperature: 0.7, 
      stream: true,
    });
    
    console.log(`[DEBUG] 2. Connection established at ${new Date().toISOString()}`);
    let isFirstChunk = true;
    let chunkCount = 0;

    // 5. Loop through the stream
    for await (const chunk of completion) {
      if (isFirstChunk) {
        console.log(`[DEBUG] 3. First word received at ${new Date().toISOString()}`);
        console.log(`[DEBUG] 4. STREAMING TEXT TO CONSOLE:`);
        isFirstChunk = false;
      }
      
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        chunkCount++;
        // Print the word instantly to your Node terminal so we can watch it
        process.stdout.write(content); 
        // Send the word to the React frontend
        res.write(content);
      }
    }
    
    console.log(`\n\n[DEBUG] 5. Stream finished! Total chunks sent: ${chunkCount}`);
    res.end(); 
    
  } catch (err) {
    console.error('\n[DEBUG] OpenAI API Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating response' });
    } else {
      res.end();
    }
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));