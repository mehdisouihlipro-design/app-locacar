#!/usr/bin/env node

const http = require('http');

const API_URL = 'http://localhost:3001/api/v1';
const EMAIL = 'admin@locacar.com';
const PASSWORD = 'AdminPass123!';
const FULL_NAME = 'Admin User';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('LocaCar API Authentication Tests');
  console.log('========================================\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check');
    console.log(`   GET ${API_URL}/health\n`);
    const health = await makeRequest('GET', '/health');
    console.log('   Response:', JSON.stringify(health.data, null, 2));
    console.log('');

    // Test 2: Register
    console.log('2. Register New User');
    console.log(`   POST ${API_URL}/auth/register`);
    console.log(`   Data: email=${EMAIL}, password=***, full_name=${FULL_NAME}\n`);
    
    const registerData = {
      email: EMAIL,
      password: PASSWORD,
      full_name: FULL_NAME,
    };
    
    const register = await makeRequest('POST', '/auth/register', registerData);
    console.log('   Status:', register.status);
    console.log('   Response:', JSON.stringify(register.data, null, 2));
    
    let userId = null;
    if (register.data.success && register.data.data?.id) {
      userId = register.data.data.id;
      console.log('\n   ✓ User registered successfully!');
      console.log(`   User ID: ${userId}`);
    } else {
      console.log('\n   ✗ Registration failed');
    }
    console.log('');

    // Test 3: Login
    console.log('3. Login');
    console.log(`   POST ${API_URL}/auth/login`);
    console.log(`   Data: email=${EMAIL}, password=***\n`);
    
    const loginData = {
      email: EMAIL,
      password: PASSWORD,
    };
    
    const login = await makeRequest('POST', '/auth/login', loginData);
    console.log('   Status:', login.status);
    console.log('   Response:', JSON.stringify(login.data, null, 2));
    
    let token = null;
    if (login.data.success && login.data.data?.token) {
      token = login.data.data.token;
      console.log('\n   ✓ Login successful!');
      console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...`);
    } else {
      console.log('\n   ✗ Login failed');
    }
    console.log('');

    // Test 4: Get Current User (with token)
    if (token) {
      console.log('4. Get Current User (/me)');
      console.log(`   GET ${API_URL}/auth/me`);
      console.log(`   Authorization: Bearer ${token.substring(0, 20)}...\n`);
      
      const meUrl = new URL(API_URL + '/auth/me');
      const options = {
        hostname: meUrl.hostname,
        port: meUrl.port,
        path: meUrl.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const me = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, data: body });
            }
          });
        });
        req.on('error', reject);
        req.end();
      });

      console.log('   Status:', me.status);
      console.log('   Response:', JSON.stringify(me.data, null, 2));
      
      if (me.data.success) {
        console.log('\n   ✓ User retrieved successfully!');
      }
    }

    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================');

  } catch (error) {
    console.error('Test Error:', error);
    process.exit(1);
  }
}

runTests();
