const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testPineconeConnection() {
  console.log('🔍 Testing Pinecone connection...\n');
  
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;
  
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY not found in .env');
    return;
  }
  
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('Index Name:', indexName);
  console.log();
  
  try {
    console.log('📡 Connecting to Pinecone...');
    const client = new Pinecone({ apiKey });
    
    console.log('✅ Client created');
    
    console.log('📋 Listing indexes...');
    const indexes = await client.listIndexes();
    console.log('✅ Indexes:', indexes.indexes?.map(i => i.name).join(', '));
    
    if (indexes.indexes?.some(i => i.name === indexName)) {
      console.log(`✅ Index "${indexName}" exists`);
      
      console.log('\n📊 Getting index stats...');
      const index = client.index(indexName);
      const stats = await index.describeIndexStats();
      console.log('✅ Stats retrieved:');
      console.log('   Total vectors:', stats.totalRecordCount);
      console.log('   Dimension:', stats.dimension);
      
      console.log('\n🎉 Pinecone connection is WORKING!');
    } else {
      console.log(`⚠️  Index "${indexName}" not found`);
      console.log('Available indexes:', indexes.indexes?.map(i => i.name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error name:', error.name);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n🔑 API key might be invalid or expired');
      console.error('Get a new one from: https://app.pinecone.io');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🌐 Network issue - check your internet connection');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

testPineconeConnection();
