const axios = require('axios')

// ===========================================
// ENHANCED UNIFIED ENDPOINT EXAMPLES
// ===========================================

// Your lead capture data (example)
const leadData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  customer_number: 'C009',
  problem_description: 'System not responding properly',
  date_of_issue: '2025-07-15',
  model: 'ECU Model X',
  'is_the_issue_exist?': 'Yes - confirmed issue',
  final_observation: 'Hardware malfunction detected',
  technical_details: 'System shows error code 0x1234',
  accept_terms_of_condition: true,
  attachment: [
    {
      originalname: 'error_screenshot.png',
      mimeType: 'image/png',
      fileUrl: 'http://localhost:3093/uploads/error_screenshot.png',
    },
  ],
  company: 'Acme Corp',
  source: 'website_form',
  interest: 'technical_support',
}

// ===========================================
// EXAMPLE 1: NO AUTHENTICATION (NEW!)
// ===========================================

async function sendLeadWithNoAuth() {
  try {
    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/leads',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // NO authentication headers at all
      },
      data: leadData,
    }

    const response = await axios(config)
    console.log('✅ Lead sent with NO AUTH:')
    console.log('Auth Type:', response.data.auth_type)
    console.log('Lead ID:', response.data.lead_id)
    console.log('Sheets Result:', response.data.sheets_result)
    console.log('User:', response.data.authenticated_user)
    console.log('Response:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ No Auth failed:', error.response?.data || error.message)
    throw error
  }
}

// ===========================================
// EXAMPLE 2: API KEY AUTHENTICATION
// ===========================================

async function sendLeadWithApiKey() {
  try {
    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/leads',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': 'api_key_12345',
      },
      data: leadData,
    }

    const response = await axios(config)
    console.log('✅ Lead sent with API Key:')
    console.log('Auth Type:', response.data.auth_type)
    console.log('Lead ID:', response.data.lead_id)
    console.log('Sheets Result:', response.data.sheets_result)
    console.log('API Key:', response.data.authenticated_user)
    return response.data
  } catch (error) {
    console.error('❌ API Key failed:', error.response?.data || error.message)
    throw error
  }
}

// ===========================================
// EXAMPLE 3: BASIC AUTHENTICATION
// ===========================================

async function sendLeadWithBasicAuth() {
  try {
    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/leads',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
      },
      data: leadData,
    }

    const response = await axios(config)
    console.log('✅ Lead sent with Basic Auth:')
    console.log('Auth Type:', response.data.auth_type)
    console.log('Lead ID:', response.data.lead_id)
    console.log('Sheets Result:', response.data.sheets_result)
    console.log('User:', response.data.authenticated_user)
    return response.data
  } catch (error) {
    console.error(
      '❌ Basic Auth failed:',
      error.response?.data || error.message
    )
    throw error
  }
}

// ===========================================
// EXAMPLE 4: BEARER TOKEN AUTHENTICATION
// ===========================================

async function sendLeadWithBearerToken() {
  try {
    // First, get a JWT token
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      username: 'admin',
      password: 'password',
    })

    const token = loginResponse.data.token

    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/leads',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: leadData,
    }

    const response = await axios(config)
    console.log('✅ Lead sent with Bearer Token:')
    console.log('Auth Type:', response.data.auth_type)
    console.log('Lead ID:', response.data.lead_id)
    console.log('Sheets Result:', response.data.sheets_result)
    console.log('User:', response.data.authenticated_user)
    return response.data
  } catch (error) {
    console.error(
      '❌ Bearer Token failed:',
      error.response?.data || error.message
    )
    throw error
  }
}

// ===========================================
// GOOGLE SHEETS UTILITIES
// ===========================================

async function setupGoogleSheets() {
  try {
    const response = await axios.post('http://localhost:3000/api/setup-sheets')
    console.log('✅ Google Sheets setup:', response.data)
    return response.data
  } catch (error) {
    console.error(
      '❌ Google Sheets setup failed:',
      error.response?.data || error.message
    )
    throw error
  }
}

async function testGoogleSheets() {
  try {
    const response = await axios.get('http://localhost:3000/api/test-sheets')
    console.log('✅ Google Sheets test:', response.data)
    return response.data
  } catch (error) {
    console.error(
      '❌ Google Sheets test failed:',
      error.response?.data || error.message
    )
    throw error
  }
}

// ===========================================
// ENHANCED INTEGRATION PLATFORM SIMULATION
// ===========================================

class EnhancedIntegrationPlatform {
  constructor() {
    this.userConfigs = [
      {
        userId: 'user1',
        authType: 'no_auth',
        credentials: {},
      },
      {
        userId: 'user2',
        authType: 'api_key',
        credentials: { apiKey: 'api_key_12345' },
      },
      {
        userId: 'user3',
        authType: 'basic_auth',
        credentials: { username: 'admin', password: 'password' },
      },
      {
        userId: 'user4',
        authType: 'bearer_token',
        credentials: { username: 'admin', password: 'password' },
      },
    ]
  }

  getAuthHeaders(userConfig) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    switch (userConfig.authType) {
      case 'no_auth':
        // No additional headers needed
        break

      case 'api_key':
        headers['x-api-key'] = userConfig.credentials.apiKey
        break

      case 'basic_auth':
        const basicAuth = Buffer.from(
          `${userConfig.credentials.username}:${userConfig.credentials.password}`
        ).toString('base64')
        headers['Authorization'] = `Basic ${basicAuth}`
        break

      case 'bearer_token':
        headers['Authorization'] = 'Bearer {{TOKEN}}' // Placeholder
        break
    }

    return headers
  }

  async forwardLead(userId, leadData) {
    const userConfig = this.userConfigs.find((u) => u.userId === userId)
    if (!userConfig) {
      throw new Error(`User configuration not found for ${userId}`)
    }

    let headers = this.getAuthHeaders(userConfig)

    // Special handling for Bearer token
    if (userConfig.authType === 'bearer_token') {
      try {
        const loginResponse = await axios.post(
          'http://localhost:3000/auth/login',
          {
            username: userConfig.credentials.username,
            password: userConfig.credentials.password,
          }
        )
        headers['Authorization'] = `Bearer ${loginResponse.data.token}`
      } catch (error) {
        throw new Error('Failed to get Bearer token')
      }
    }

    const config = {
      method: 'post',
      url: 'http://localhost:3000/api/leads',
      headers: headers,
      data: leadData,
    }

    try {
      const response = await axios(config)
      console.log(`✅ Lead forwarded for ${userId} (${userConfig.authType}):`)
      console.log('Auth Type:', response.data.auth_type)
      console.log('Lead ID:', response.data.lead_id)
      console.log('Sheets Result:', response.data.sheets_result)
      console.log('User:', response.data.authenticated_user)
      return response.data
    } catch (error) {
      console.error(
        `❌ Failed to forward lead for ${userId}:`,
        error.response?.data || error.message
      )
      throw error
    }
  }

  async forwardLeadToAll(leadData) {
    console.log(
      '🚀 Forwarding lead to all configured users (including no auth)...\n'
    )

    const results = []
    for (const userConfig of this.userConfigs) {
      try {
        const result = await this.forwardLead(userConfig.userId, leadData)
        results.push({ userId: userConfig.userId, success: true, result })
        console.log('')
      } catch (error) {
        results.push({
          userId: userConfig.userId,
          success: false,
          error: error.message,
        })
        console.log('')
      }
    }

    return results
  }
}

// ===========================================
// WEBHOOK EXAMPLES (Enhanced)
// ===========================================

async function sendWebhookWithAllAuthTypes() {
  const webhookData = {
    event: 'lead_captured',
    timestamp: new Date().toISOString(),
    data: leadData,
    source: 'landing_page_form',
  }

  console.log('🔗 Testing webhook endpoint with all auth types...\n')

  // 1. No Auth
  try {
    const response = await axios.post(
      'http://localhost:3000/api/webhook',
      webhookData,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
    console.log('✅ Webhook sent with No Auth:', response.data.auth_type)
    console.log('Sheets Result:', response.data.sheets_result)
  } catch (error) {
    console.error(
      '❌ Webhook with No Auth failed:',
      error.response?.data || error.message
    )
  }

  // 2. API Key
  try {
    const response = await axios.post(
      'http://localhost:3000/api/webhook',
      webhookData,
      {
        headers: {
          'x-api-key': 'api_key_12345',
          'Content-Type': 'application/json',
        },
      }
    )
    console.log('✅ Webhook sent with API Key:', response.data.auth_type)
    console.log('Sheets Result:', response.data.sheets_result)
  } catch (error) {
    console.error(
      '❌ Webhook with API Key failed:',
      error.response?.data || error.message
    )
  }

  // 3. Basic Auth
  try {
    const response = await axios.post(
      'http://localhost:3000/api/webhook',
      webhookData,
      {
        headers: {
          Authorization: 'Basic YWRtaW46cGFzc3dvcmQ=',
          'Content-Type': 'application/json',
        },
      }
    )
    console.log('✅ Webhook sent with Basic Auth:', response.data.auth_type)
    console.log('Sheets Result:', response.data.sheets_result)
  } catch (error) {
    console.error(
      '❌ Webhook with Basic Auth failed:',
      error.response?.data || error.message
    )
  }
}

// ===========================================
// DEMO RUNNER
// ===========================================

async function runEnhancedDemo() {
  console.log('🎯 ENHANCED UNIFIED AUTHENTICATION DEMO\n')
  console.log('✨ NEW FEATURES:')
  console.log('   • No Authentication support')
  console.log('   • Google Sheets integration')
  console.log('   • Automatic data storage with timestamps\n')

  // Setup Google Sheets
  console.log('📊 Setting up Google Sheets...')
  await setupGoogleSheets()
  console.log('')

  // Test Google Sheets connection
  console.log('🧪 Testing Google Sheets connection...')
  await testGoogleSheets()
  console.log('')

  // Test all auth methods
  console.log('1️⃣ Testing No Authentication (NEW!)...')
  await sendLeadWithNoAuth()
  console.log('')

  console.log('2️⃣ Testing API Key Authentication...')
  await sendLeadWithApiKey()
  console.log('')

  console.log('3️⃣ Testing Basic Authentication...')
  await sendLeadWithBasicAuth()
  console.log('')

  console.log('4️⃣ Testing Bearer Token Authentication...')
  await sendLeadWithBearerToken()
  console.log('')

  // Test integration platform simulation
  console.log('5️⃣ Testing Enhanced Integration Platform...')
  const platform = new EnhancedIntegrationPlatform()
  await platform.forwardLeadToAll(leadData)
  console.log('')

  // Test webhook endpoints
  console.log('6️⃣ Testing Webhook Endpoints...')
  await sendWebhookWithAllAuthTypes()
  console.log('')

  console.log('✅ All enhanced tests completed!')
  console.log('\n💡 Key Enhancements:')
  console.log('   • 4 auth types supported (including no auth)')
  console.log('   • Automatic Google Sheets storage')
  console.log('   • Timestamps and full data logging')
  console.log('   • Perfect for integration platforms')
  console.log('   • Real-time data backup to Google Sheets')
}

// ===========================================
// GOOGLE SHEETS SETUP INSTRUCTIONS
// ===========================================

function printGoogleSheetsSetup() {
  console.log('\n📋 GOOGLE SHEETS SETUP INSTRUCTIONS:')
  console.log('')
  console.log('1. Create a Google Cloud Project:')
  console.log('   - Go to https://console.cloud.google.com/')
  console.log('   - Create a new project or select existing')
  console.log('')
  console.log('2. Enable Google Sheets API:')
  console.log('   - Navigate to APIs & Services > Library')
  console.log('   - Search for "Google Sheets API" and enable it')
  console.log('')
  console.log('3. Create Service Account:')
  console.log('   - Go to APIs & Services > Credentials')
  console.log('   - Create Credentials > Service Account')
  console.log('   - Download the JSON key file')
  console.log('')
  console.log('4. Set Environment Variables:')
  console.log('   export GOOGLE_PROJECT_ID="your-project-id"')
  console.log('   export GOOGLE_PRIVATE_KEY_ID="your-private-key-id"')
  console.log('   export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."')
  console.log(
    '   export GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"'
  )
  console.log('   export GOOGLE_CLIENT_ID="your-client-id"')
  console.log('   export GOOGLE_SPREADSHEET_ID="your-spreadsheet-id"')
  console.log('')
  console.log('5. Create Google Sheet:')
  console.log('   - Create a new Google Sheet')
  console.log('   - Share it with your service account email')
  console.log('   - Copy the spreadsheet ID from the URL')
  console.log('')
  console.log('6. Test the connection:')
  console.log('   curl http://localhost:3000/api/test-sheets')
  console.log('')
}

// Export for use in other files
module.exports = {
  sendLeadWithNoAuth,
  sendLeadWithApiKey,
  sendLeadWithBasicAuth,
  sendLeadWithBearerToken,
  setupGoogleSheets,
  testGoogleSheets,
  EnhancedIntegrationPlatform,
  sendWebhookWithAllAuthTypes,
  runEnhancedDemo,
  printGoogleSheetsSetup,
}

// Run demo if this file is executed directly
if (require.main === module) {
  printGoogleSheetsSetup()
  console.log('\n' + '='.repeat(50))
  runEnhancedDemo()
}
