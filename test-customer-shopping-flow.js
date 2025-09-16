#!/usr/bin/env node

const axios = require('axios');

// Service endpoints
const CUSTOMER_FRONTEND = 'http://localhost:4002';

// Test data
const testCustomer = {
  name: 'Shopping Test User',
  email: 'shopper@test.com',
  password: 'shopperPass123',
  country: 'usa'
};

const testOrder = {
  cartData: {
    merchantId: "550e8400-e29b-41d4-a716-446655440000",
    items: [
      {
        productId: "550e8400-e29b-41d4-a716-446655440001",
        name: "California Roll",
        quantity: 2,
        price: 12.99
      }
    ],
    subtotal: 25.98,
    taxAmount: 2.08,
    deliveryFee: 2.99,
    discountAmount: 0,
    deliveryAddress: {
      street: "123 Shopping St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "USA"
    },
    customerName: "Shopping Test User",
    customerEmail: "shopper@test.com",
    merchantName: "Urban Bites",
    countryCode: "USA",
    currencyCode: "USD"
  },
  paymentMethod: {
    type: "credit_card",
    provider: "loopback"
  }
};

async function testShoppingFlow() {
  console.log('🛒 Testing Complete Customer Shopping Flow');
  console.log('=' .repeat(50));

  // Create axios instance with cookie jar for session management
  const cookieJar = axios.create({
    baseURL: CUSTOMER_FRONTEND,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Store cookies manually for Node.js testing
  let sessionCookie = '';

  try {
    // Step 1: Test frontend availability
    console.log('\n🌐 Step 1: Testing frontend availability...');
    const frontendResponse = await cookieJar.get('/');
    console.log('✅ Customer Frontend: Available');

    // Step 2: Test registration
    console.log('\n👤 Step 2: Testing user registration...');
    
    try {
      const registerResponse = await cookieJar.post('/api/register', testCustomer);
      console.log('✅ Registration successful');
      console.log('   User:', registerResponse.data.user);
      
      // Extract cookies for subsequent requests
      if (registerResponse.headers['set-cookie']) {
        sessionCookie = registerResponse.headers['set-cookie']
          .find(cookie => cookie.startsWith('msdp_session='))?.split(';')[0] || '';
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, testing login...');
        const loginResponse = await cookieJar.post('/api/login', {
          email: testCustomer.email,
          password: testCustomer.password
        });
        console.log('✅ Login successful');
        console.log('   User:', loginResponse.data.user);
        
        // Extract cookies for subsequent requests
        if (loginResponse.headers['set-cookie']) {
          sessionCookie = loginResponse.headers['set-cookie']
            .find(cookie => cookie.startsWith('msdp_session='))?.split(';')[0] || '';
        }
      } else {
        throw error;
      }
    }

    // Step 3: Test session validation
    console.log('\n🔐 Step 3: Testing authenticated session...');
    const sessionResponse = await cookieJar.get('/api/session', {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {}
    });
    console.log('✅ Session validated');
    console.log('   User ID:', sessionResponse.data.user.id);
    console.log('   Email:', sessionResponse.data.user.email);

    // Step 4: Test order creation
    console.log('\n🛒 Step 4: Testing order creation...');
    const orderResponse = await cookieJar.post('/api/orders/create', testOrder, {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {}
    });
    
    if (orderResponse.data.ok) {
      console.log('✅ Order created successfully!');
      console.log('   Order ID:', orderResponse.data.order.id);
      console.log('   Order Number:', orderResponse.data.order.order_number);
      console.log('   Status:', orderResponse.data.order.status);
      console.log('   Payment Status:', orderResponse.data.payment.status);
      console.log('   Total Amount:', orderResponse.data.order.total_amount);
    } else {
      console.log('❌ Order creation failed:', orderResponse.data.message);
      return;
    }

    // Step 5: Test order history
    console.log('\n📚 Step 5: Testing order history...');
    const ordersResponse = await cookieJar.get('/api/orders', {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {}
    });
    
    if (ordersResponse.data.ok) {
      const orders = ordersResponse.data.orders;
      console.log('✅ Order history retrieved');
      console.log('   Total orders:', orders.length);
      if (orders.length > 0) {
        console.log('   Latest order:', orders[0].order_number);
        console.log('   Status:', orders[0].status);
      }
    } else {
      console.log('❌ Order history failed:', ordersResponse.data.message);
    }

    console.log('\n🎉 Complete Shopping Flow Test Successful!');
    console.log('=' .repeat(50));
    console.log('✅ Frontend: Working on http://localhost:4002');
    console.log('✅ User Registration: Working');
    console.log('✅ User Authentication: Working');
    console.log('✅ Session Management: Working');
    console.log('✅ Order Creation: Working');
    console.log('✅ Order History: Working');
    console.log('✅ Backend Integration: Complete');

    console.log('\n🌐 Ready for Manual Testing:');
    console.log('1. Open http://localhost:4002 in browser');
    console.log('2. Register/Login as a customer');
    console.log('3. Click "View" on any merchant (e.g., Urban Bites)');
    console.log('4. Add items to cart');
    console.log('5. Proceed to checkout');
    console.log('6. Fill delivery address and place order');
    console.log('7. View order success page');
    console.log('8. Check order history at /orders');

  } catch (error) {
    console.error('\n❌ Shopping flow test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testShoppingFlow();
