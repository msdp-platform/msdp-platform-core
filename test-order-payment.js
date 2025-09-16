#!/usr/bin/env node

const axios = require("axios");

// Service endpoints
const ORDER_SERVICE = "http://localhost:3006";
const PAYMENT_SERVICE = "http://localhost:3007";
const USER_SERVICE = "http://localhost:3003";

// Test data
const testUser = {
  email: "test@example.com",
  password: "testPassword123",
  name: "John Doe",
  country: "usa",
};

const testOrder = {
  items: [
    {
      productId: "550e8400-e29b-41d4-a716-446655440001", // Valid UUID for menu item
      name: "Test Product",
      quantity: 2,
      price: 29.99,
    },
  ],
  total_amount: 59.98,
  currency: "USD",
  shipping_address: {
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    zip: "12345",
    country: "USA",
  },
  billing_address: {
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    zip: "12345",
    country: "USA",
  },
  payment_method: "credit_card",
};

async function testServices() {
  console.log("🧪 Starting MSDP Order-Payment Integration Test");
  console.log("=".repeat(50));

  try {
    // Step 1: Test service health
    console.log("\n📊 Step 1: Testing service health...");

    const [userHealth, orderHealth, paymentHealth] = await Promise.all([
      axios.get(`${USER_SERVICE}/health`),
      axios.get(`${ORDER_SERVICE}/health`),
      axios.get(`${PAYMENT_SERVICE}/health`),
    ]);

    console.log("✅ User Service:", userHealth.data.status);
    console.log("✅ Order Service:", orderHealth.data.status);
    console.log("✅ Payment Service:", paymentHealth.data.status);

    // Step 2: Register a test user
    console.log("\n👤 Step 2: Registering test user...");
    let userToken;
    try {
      const registerResponse = await axios.post(
        `${USER_SERVICE}/api/auth/register`,
        testUser
      );
      console.log("✅ User registered successfully");
      console.log(
        "   Response:",
        JSON.stringify(registerResponse.data, null, 2)
      );
      userToken =
        registerResponse.data.token || registerResponse.data.data?.token;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log("ℹ️  User already exists, logging in...");
        const loginResponse = await axios.post(
          `${USER_SERVICE}/api/auth/login`,
          {
            email: testUser.email,
            password: testUser.password,
          }
        );
        console.log(
          "   Login Response:",
          JSON.stringify(loginResponse.data, null, 2)
        );
        userToken = loginResponse.data.token || loginResponse.data.data?.token;
        console.log("✅ User logged in successfully");
      } else {
        throw error;
      }
    }

    // Step 3: Create an order
    console.log("\n🛒 Step 3: Creating test order...");
    console.log("   Using token:", userToken ? "Present" : "Missing");

    // Prepare order data in the format expected by the Order Service
    const orderData = {
      cartData: {
        merchantId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID for merchant
        items: testOrder.items,
        subtotal: testOrder.total_amount,
        taxAmount: 0,
        deliveryFee: 0,
        discountAmount: 0,
        deliveryAddress: testOrder.shipping_address,
        customerName: "John Doe",
        customerEmail: "test@example.com",
        merchantName: "Test Restaurant",
        countryCode: "USA",
        currencyCode: testOrder.currency,
      },
      paymentMethod: {
        type: testOrder.payment_method,
        provider: "loopback",
      },
    };

    const orderResponse = await axios.post(
      `${ORDER_SERVICE}/api/orders/create`,
      orderData,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    const orderResult = orderResponse.data;
    const order = orderResult.order;
    const payment = orderResult.payment;

    console.log("✅ Order created:", order.id);
    console.log("   Amount:", order.total_amount, order.currency);
    console.log("   Status:", order.status);
    console.log("✅ Payment processed:", payment.id);
    console.log("   Payment Status:", payment.status);

    // Step 4: Payment was already processed during order creation
    console.log("\n💳 Step 4: Payment already processed during order creation");
    console.log("   Payment ID:", payment.id);
    console.log("   Status:", payment.status);
    console.log("   Gateway:", payment.gateway_provider || "loopback");

    // Step 5: Check order status after payment
    console.log("\n📋 Step 5: Checking order status...");
    const updatedOrderResponse = await axios.get(
      `${ORDER_SERVICE}/api/orders/${order.id}`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    const updatedOrder = updatedOrderResponse.data;
    console.log("✅ Order status:", updatedOrder.status);

    // Step 6: Get payment details (if payment service has the route)
    console.log("\n💰 Step 6: Payment details already available");
    console.log("   Payment ID:", payment.id);
    console.log("   Final status:", payment.status);
    console.log("   Gateway Provider:", payment.gateway_provider || "loopback");
    console.log("   Transaction ID:", payment.gateway_transaction_id || "N/A");

    // Step 7: Test order history
    console.log("\n📚 Step 7: Testing order history...");

    // Extract user ID from the order response
    const userId = order.user_id;
    const orderHistoryResponse = await axios.get(
      `${ORDER_SERVICE}/api/orders/user/${userId}`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    const orderHistoryResult = orderHistoryResponse.data;
    const orderHistory = orderHistoryResult.orders;
    console.log("✅ Order history retrieved:", orderHistory.length, "orders");

    console.log("\n🎉 All tests completed successfully!");
    console.log("=".repeat(50));
    console.log("✅ User registration/login: Working");
    console.log("✅ Order creation: Working");
    console.log("✅ Payment processing: Working");
    console.log("✅ Service integration: Working");
    console.log("✅ Authentication flow: Working");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
    process.exit(1);
  }
}

// Check if axios is available
async function checkDependencies() {
  try {
    require("axios");
  } catch (error) {
    console.error("❌ axios is not installed. Please run: npm install axios");
    process.exit(1);
  }
}

// Run the test
checkDependencies()
  .then(() => {
    testServices();
  })
  .catch(console.error);
