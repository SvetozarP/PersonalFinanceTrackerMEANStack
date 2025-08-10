const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

// Test data
const testUser = {
  email: 'test2@example.com',
  password: 'TestPass123!',
  firstName: 'John',
  lastName: 'Doe'
};

const loginData = {
  email: 'test2@example.com',
  password: 'TestPass123!'
};

async function testEndpoints() {
  console.log('🧪 Testing Auth Endpoints...\n');

  try {
    // Test 1: Register endpoint
    console.log('1️⃣ Testing Register Endpoint...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Register successful:', registerResponse.data);
    console.log('Status:', registerResponse.status);
    console.log('');

    // Test 2: Login endpoint
    console.log('2️⃣ Testing Login Endpoint...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data);
    console.log('Status:', loginResponse.status);
    console.log('Access Token:', loginResponse.data.data.accessToken ? '✅ Present' : '❌ Missing');
    console.log('');

    // Test 3: Try to register with same email (should fail)
    console.log('3️⃣ Testing Duplicate Registration (should fail)...');
    try {
      await axios.post(`${BASE_URL}/register`, testUser);
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Duplicate registration correctly rejected');
        console.log('Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test invalid login (wrong password)
    console.log('4️⃣ Testing Invalid Login (wrong password)...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      });
      console.log('❌ Expected failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.log('✅ Invalid login correctly rejected');
        console.log('Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test validation errors (missing fields)
    console.log('5️⃣ Testing Validation Errors (missing fields)...');
    try {
      await axios.post(`${BASE_URL}/register`, {
        email: 'invalid-email',
        password: 'weak'
      });
      console.log('❌ Expected validation failure but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation errors correctly caught');
        console.log('Errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testEndpoints();
