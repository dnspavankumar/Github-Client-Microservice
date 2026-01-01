// Test what the extension is actually sending
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/v1/query', (req, res) => {
  console.log('=== RECEIVED REQUEST ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('minScore:', req.body.minScore);
  console.log('========================');
  
  res.json({
    answer: 'Test response',
    sources: [],
    metadata: { tokensUsed: 0, latencyMs: 0, model: 'test', retrievedChunks: 0 }
  });
});

app.listen(3001, () => {
  console.log('Test server running on http://localhost:3001');
  console.log('Update extension API_BASE_URL to http://localhost:3001/api/v1');
  console.log('Then click Analyze Repository to see what minScore is being sent');
});
