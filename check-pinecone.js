const axios = require('axios');

async function checkPinecone() {
  console.log('🔍 Checking Pinecone stats...\n');
  
  try {
    const response = await axios.get('http://localhost:3000/api/v1/stats');
    const stats = response.data.pinecone;
    
    console.log('📊 Pinecone Index Stats:');
    console.log('  Total vectors:', stats.totalRecordCount || 0);
    console.log('  Dimension:', stats.dimension);
    console.log('  Namespaces:', JSON.stringify(stats.namespaces, null, 2));
    
    if (stats.totalRecordCount === 0) {
      console.log('\n⚠️  WARNING: No vectors in Pinecone!');
      console.log('  This means the ingestion might have failed.');
      console.log('  Try re-analyzing the repository.\n');
    } else {
      console.log('\n✅ Vectors exist in Pinecone!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure your server is running: npm run dev\n');
  }
}

checkPinecone();
