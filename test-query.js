const axios = require('axios');

async function testQuery() {
  console.log('🔍 Testing query...\n');
  
  const query = {
    repoId: "dnspavankumar/DeepBusinessResearchAssistant",
    query: "does this have a dark theme",
    topK: 10,
    minScore: 0.3  // Lower threshold to see all results
  };
  
  try {
    console.log('Sending query:', query.query);
    const response = await axios.post('http://localhost:3000/api/v1/query', query);
    
    console.log('\n📊 Response:');
    console.log('  Answer length:', response.data.answer.length);
    console.log('  Sources:', response.data.sources.length);
    console.log('  Retrieved chunks:', response.data.metadata.retrievedChunks);
    console.log('  Latency:', response.data.metadata.latencyMs + 'ms');
    
    if (response.data.sources.length > 0) {
      console.log('\n📁 Top sources:');
      response.data.sources.slice(0, 5).forEach((source, i) => {
        console.log(`  ${i + 1}. ${source.file} (score: ${source.score})`);
      });
    }
    
    console.log('\n💬 Answer:');
    console.log(response.data.answer);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testQuery();
