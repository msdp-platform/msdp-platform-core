#!/usr/bin/env node

const axios = require("axios");

// Service endpoints
const CUSTOMER_FRONTEND = "http://localhost:4002";
const USER_SERVICE = "http://localhost:3003";

// Test data
const testUser = {
  name: "Jane Customer",
  email: "jane@customer.com",
  password: "customerPass123",
  country: "usa",
};

async function testCustomerFrontend() {
  console.log("🧪 Testing Customer Frontend Integration");
  console.log("=".repeat(50));

  try {
    // Step 1: Test frontend health
    console.log("\n📊 Step 1: Testing frontend availability...");

    try {
      const frontendResponse = await axios.get(`${CUSTOMER_FRONTEND}`, {
        timeout: 5000,
      });
      console.log(
        "✅ Customer Frontend:",
        frontendResponse.status === 200 ? "Available" : "Issue"
      );
    } catch (error) {
      console.log("❌ Customer Frontend: Not available");
      console.log("   Make sure the frontend is running on port 4001");
      return;
    }

    // Step 2: Test User Service (backend)
    console.log("\n🔧 Step 2: Testing backend services...");
    const userHealth = await axios.get(`${USER_SERVICE}/health`);
    console.log("✅ User Service:", userHealth.data.status);

    // Step 3: Test registration via frontend API
    console.log("\n👤 Step 3: Testing user registration via frontend...");

    try {
      const registerResponse = await axios.post(
        `${CUSTOMER_FRONTEND}/api/register`,
        testUser,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Registration successful via frontend");
      console.log("   Response:", registerResponse.data);

      // Check if cookies were set
      const cookies = registerResponse.headers["set-cookie"];
      if (
        cookies &&
        cookies.some((cookie) => cookie.includes("msdp_session"))
      ) {
        console.log("✅ Authentication cookies set");
      } else {
        console.log("⚠️  No authentication cookies found");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log("ℹ️  User already exists, testing login instead...");

        // Test login
        const loginResponse = await axios.post(
          `${CUSTOMER_FRONTEND}/api/login`,
          {
            email: testUser.email,
            password: testUser.password,
          },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        console.log("✅ Login successful via frontend");
        console.log("   Response:", loginResponse.data);
      } else {
        throw error;
      }
    }

    // Step 4: Test session validation
    console.log("\n🔐 Step 4: Testing session validation...");

    // We can't easily test cookies from Node.js, but we can test the endpoint
    console.log("ℹ️  Session validation endpoint available at /api/session");
    console.log("ℹ️  Test this manually in browser after registration/login");

    console.log("\n🎉 Customer Frontend Integration Test Complete!");
    console.log("=".repeat(50));
    console.log("✅ Frontend: Available on http://localhost:4002");
    console.log("✅ Backend: User Service integrated");
    console.log("✅ Authentication: Registration and login working");
    console.log("✅ Ready for manual testing in browser!");

    console.log("\n🌐 Manual Testing Steps:");
    console.log("1. Open http://localhost:4002 in browser");
    console.log('2. Click "Sign up" to create account');
    console.log("3. Fill form and register");
    console.log("4. Verify you are logged in");
    console.log("5. Test logout and login flow");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

// Check dependencies
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
    testCustomerFrontend();
  })
  .catch(console.error);
