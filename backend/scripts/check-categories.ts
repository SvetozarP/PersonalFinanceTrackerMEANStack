import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function checkCategories() {
  try {
    console.log('🔍 Checking categories in database...');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'jane.smith@example.com',
      password: 'password123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Logged in successfully');
    
    // Get categories
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📋 Categories found:', categoriesResponse.data.data.length);
    console.log('Categories:');
    categoriesResponse.data.data.forEach((cat: any, index: number) => {
      console.log(`  ${index + 1}. ${cat.name} (ID: ${cat._id}) - Color: ${cat.color}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCategories();


