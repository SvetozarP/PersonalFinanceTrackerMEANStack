import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface TestUser {
  email: string;
  password: string;
  token?: string;
}

const testUser: TestUser = {
  email: 'jane.smith@example.com',
  password: 'password123!'
};

async function loginUser(): Promise<string> {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (response.data.success && response.data.data?.accessToken) {
      console.log('✅ User logged in successfully');
      return response.data.data.accessToken;
    } else {
      throw new Error('Login failed: No token received');
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function testFinancialDashboard(token: string) {
  try {
    console.log('📊 Testing financial dashboard with currency separation...');
    
    const response = await axios.get(`${API_BASE_URL}/financial/dashboard?separateByCurrency=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Dashboard data retrieved successfully');
      
      // Check if we have currency-separated data
      if (typeof data === 'object' && !Array.isArray(data)) {
        const currencies = Object.keys(data);
        console.log(`📈 Found ${currencies.length} currencies:`, currencies);
        
        currencies.forEach(currency => {
          const currencyData = data[currency];
          console.log(`\n💰 ${currency} Dashboard:`);
          console.log(`  - Total Balance: ${currencyData.overview.totalBalance}`);
          console.log(`  - Monthly Income: ${currencyData.overview.monthlyIncome}`);
          console.log(`  - Monthly Expenses: ${currencyData.overview.monthlyExpenses}`);
          console.log(`  - Recent Transactions: ${currencyData.recentTransactions.length}`);
          console.log(`  - Top Categories: ${currencyData.topCategories.length}`);
          console.log(`  - Spending Trends: ${currencyData.spendingTrends.length}`);
          
          if (currencyData.recentTransactions.length > 0) {
            console.log(`  - Sample transactions:`);
            currencyData.recentTransactions.slice(0, 3).forEach((tx: any) => {
              console.log(`    * ${tx.description}: ${tx.amount} ${tx.currency || 'USD'}`);
            });
          }
          
          if (currencyData.topCategories.length > 0) {
            console.log(`  - Top categories:`);
            currencyData.topCategories.slice(0, 3).forEach((cat: any) => {
              console.log(`    * Category name:`, cat.name);
              console.log(`    * Category name type:`, typeof cat.name);
              console.log(`    * Category amount:`, cat.amount);
              console.log(`    * Full category object:`, JSON.stringify(cat, null, 2));
            });
          }
        });
        
        // Test combined recent transactions
        const allTransactions: any[] = [];
        currencies.forEach(currency => {
          if (data[currency].recentTransactions) {
            allTransactions.push(...data[currency].recentTransactions);
          }
        });
        
        console.log(`\n🔄 Combined recent transactions: ${allTransactions.length}`);
        if (allTransactions.length > 0) {
          console.log('📋 Sample combined transactions:');
          allTransactions.slice(0, 5).forEach((tx: any) => {
            console.log(`  * ${tx.description}: ${tx.amount} ${tx.currency || 'USD'} (${new Date(tx.date).toLocaleDateString()})`);
          });
        }
        
      } else {
        console.log('⚠️ Dashboard data is not currency-separated');
        console.log('Data structure:', typeof data, Array.isArray(data) ? 'Array' : 'Object');
      }
      
    } else {
      console.error('❌ Dashboard request failed:', response.data.message);
    }
    
  } catch (error: any) {
    console.error('❌ Dashboard test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Financial Dashboard Test\n');
    
    // Login to get token
    const token = await loginUser();
    testUser.token = token;
    
    // Test financial dashboard
    await testFinancialDashboard(token);
    
    console.log('\n✅ Financial Dashboard test completed');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();