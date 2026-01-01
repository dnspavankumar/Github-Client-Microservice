const axios = require('axios');

async function testSummaryQuery() {
  console.log('🔍 Testing NEW summary query...\n');
  
  const query = {
    repoId: "dnspavankumar/DeepBusinessResearchAssistant",
    query: "README documentation overview main features installation setup usage",
    topK: 5,
    minScore: 0.15
  };
  
  try {
    console.log('Query:', query.query);
    console.log('Min Score:', query.minScore);
    console.log('Top K:', query.topK);
    console.log('\nSearching...\n');
    
    const response = await axios.post('http://localhost:3000/api/v1/query', query);
    
    console.log('📊 Results:');
    console.log('  Sources found:', response.data.sources.length);
    console.log('  Retrieved chunks:', response.data.metadata.retrievedChunks);
    
    if (response.data.sources.length > 0) {
      console.log('\n📁 Top matching files:');
      const uniqueFiles = [...new Set(response.data.sources.map(s => s.file))];
      uniqueFiles.slice(0, 5).forEach((file, i) => {
        const sources = response.data.sources.filter(s => s.file === file);
        const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
        console.log(`  ${i + 1}. ${file} (avg score: ${avgScore.toFixed(3)})`);
      });
      
      console.log('\n💬 Summary (first 500 chars):');
      console.log(response.data.answer.substring(0, 500) + '...');
      console.log('\n✅ Summary generation WORKS!');
    } else {
      console.log('\n❌ No sources found - summary will fail');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSummaryQuery();
