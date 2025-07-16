const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const { google } = require('googleapis')
const fs = require('fs').promises

const app = express()
const PORT = process.env.PORT || 3000

// ===========================================
// PRODUCTION CONFIGURATION
// ===========================================

// Trust proxy settings for deployment platforms
// This fixes the X-Forwarded-For header warning and enables proper rate limiting
const configureProxyTrust = () => {
  if (process.env.NODE_ENV === 'production') {
    // Trust first proxy (Render, Railway, Heroku, etc.)
    app.set('trust proxy', 1)
    console.log('✅ Trust proxy enabled for production')
  } else {
    // For local development
    app.set('trust proxy', 'loopback')
    console.log('🔧 Trust proxy set for local development')
  }
}

// Apply proxy configuration
configureProxyTrust()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// ===========================================
// MOCK DATA STORAGE (In production, use a database)
// ===========================================

// Mock API Keys storage
const validApiKeys = new Set([
  'api_key_12345',
  'api_key_67890',
  'api_key_abcdef',
])

// Mock users for Basic Auth
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
  },
  {
    id: 2,
    username: 'user',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
  },
]

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

// ===========================================
// GOOGLE SHEETS CONFIGURATION
// ===========================================

// Google Sheets configuration - You'll need to set these up
const GOOGLE_SHEETS_CONFIG = {
  // You can get this from Google Cloud Console
  spreadsheetId:
    process.env.GOOGLE_SPREADSHEET_ID ||
    '1-j3-tCsgn67iwuu3zG0Xh0xJ_BuZ22hqwddnnnsUDg0', // Example ID
  range: 'Sheet1!A:Z', // Range to append data

  // Service account credentials (create in Google Cloud Console)
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID || 'vishal-1529849127969',
    private_key_id:
      process.env.GOOGLE_PRIVATE_KEY_ID ||
      '85c4f66c02d54ce59c9dd1ce6b580f7dd5497426',
    private_key:
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ||
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCd4XNLpb1dShhg\nN299l/qxfqUacXXQUOfkOCjSmJ+jAx9LGFBZXmKMIfahLNbsbTzocJAaPw1BlUOK\nXciy7ZgYXwVxQIqRZwlJag2KeblnG0XKKtKVRL6aXVH2WRILbBv+pqALbp0j6jxi\nq3DnFhUxdhO1OefkmaKxQ9iScJSFDhyokfeTSqXorkez0A3KGOlzXJxLGLCDeHVh\nMnXUX1tN0vhMUdr2EDFzdp2M5CeJxNwDUb0In6SjT561R5wKQrO4KMr3QTk5FHyD\nRa7UjkxHnRvyv+MfME6GozGXIIqswsNOIqqDPT7fX/MRhNuvLDguj2AbH+IHkchb\nazEgNJzLAgMBAAECggEANthfU4ufdV1si1wmnGQj3+4FT+LTUQsSC2tg7wu7BQds\nIwuuueT6agDQatwnS1mFW5/ix2NY6Qv/uvzqYBH+kJTN0LJhkLJQ/RJc4tp3SDSm\nsVzf65/GcNxzQRdfF921+egLV/1UlGnmEUbKQVSgBx8kKIQVpQmkBV1yyihWx8N7\n+79p84XWLYQw0/t4lN2othdPI7gJkJTBEG/YZCuJb96VKvJAYwY5chOwDxFROGfG\ndvzTheBFG/adHtNoiQ7QUoYmY2WmnRyot0Scqfe9FiqCiJVbpRLI2hd0KlHVS3Na\npSpDsP/wx7cGtTRxcZjrmUF3+Jvrr207oGjCe36ERQKBgQDPojeJHb0yAYCQF0u/\nuP1wGB6PbEXeWNDdjggn5HtSzjiOW4Sh12fzP0xzSSyI9Ed/bNRxyjTRBWduS50O\n1Q0sNSCbsMmbwsCzTZkZy2CcL0T1/PBKvYgeFIZBMI4fNkNySUkevoPi3PDm+hDL\n2Pw/xUs3vWbyYmk78X1pIYrw3QKBgQDCqFJOFjNnX2J+11QK3YgC+HVarVKlc3/J\nG5ZJxsJDtTkJBe5fwjm0D4F+pBzoUs8vNRRzAJ6NSl/AfYpr9q37lgHtlAVQTfNU\n8P/u+B2rWdfOTrv/vKYmMSwN9ao+63wA/bAgzSIvGMu7TWAHJ8eYia8DMjwzwV86\n97Uh14JVxwKBgB8tm6tCRPOqWBTK+rvqWlwnswcUWhV+PrbWKhFbdM1FXCa8RVlM\nEDbtjVxOY5qZG9ddjzUbCP1OE27zeb0NbvHxdFkMnel+wBLslw3RhUtOqctKVQbU\nGQlzSYmmceDr9ArISGuObh110dLNQBJsHcyxoo7XKQtCjczLgWp09/kdAoGAB3/u\ns919G4V8SQDI1yZT4DFsbBLzdTZu/POYJb2HrI4l5WgaGAxmpr5WMefmyTivjNUR\ntaCXe0AbUlJD7Ab0CxZrepjSX5axQluKsM1Ub06l1ugHrEG7cQtB9EO7zHLMM0mS\n6KCeqYveBZhkk8H/mavsV0YvNZtErQPwMZ6ZAe8CgYEAjZhDJM5lImMcuYNew1Cx\nOHfURh3sp5dqqgMH7EZVgCIjoeuSmyuDRgDSr+XgpguRRl8ZUc6XuJx27UGwT4rz\nBrV8eAd+60M0xqBcG2xg/0J8tLohYOFZN+gYs47ZlgsOwmV5Mo9eupWC+H70zb8N\nIAHiGoaWX5FuUeAjzycLyWI=\n-----END PRIVATE KEY-----\n',
    client_email:
      process.env.GOOGLE_CLIENT_EMAIL ||
      'test-tweddle-lead@vishal-1529849127969.iam.gserviceaccount.com',
    client_id: process.env.GOOGLE_CLIENT_ID || '108983759973014021948',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      process.env.GOOGLE_CLIENT_CERT_URL ||
      'https://www.googleapis.com/robot/v1/metadata/x509/test-tweddle-lead%40vishal-1529849127969.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  },
}

// Initialize Google Sheets API
let sheets
try {
  const auth = new google.auth.GoogleAuth({
    credentials: GOOGLE_SHEETS_CONFIG.credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  sheets = google.sheets({ version: 'v4', auth })
} catch (error) {
  console.warn(
    '⚠️  Google Sheets not configured. Set environment variables for Google Sheets integration.'
  )
  sheets = null
}

// Function to append data to Google Sheets
async function appendToGoogleSheets(leadData, authInfo) {
  if (!sheets) {
    console.warn('⚠️  Google Sheets not configured, skipping sheet update')
    return { success: false, message: 'Google Sheets not configured' }
  }

  try {
    const timestamp = new Date().toISOString()

    // Prepare row data - flatten the lead data for Excel
    const rowData = [
      timestamp,
      leadData.name || '',
      leadData.email || '',
      leadData.phone || '',
      leadData.customer_number || '',
      leadData.problem_description || '',
      leadData.date_of_issue || '',
      leadData.model || '',
      leadData['is_the_issue_exist?'] || '',
      leadData.final_observation || '',
      leadData.technical_details || '',
      leadData.accept_terms_of_condition || false,
      JSON.stringify(leadData.attachment || []), // Convert array to JSON string
      authInfo.auth_type || 'No Auth',
      authInfo.user?.username || authInfo.api_key || 'anonymous',
      JSON.stringify(leadData), // Full data as JSON backup
    ]

    // Append to Google Sheets
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: GOOGLE_SHEETS_CONFIG.range,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData],
      },
    })

    console.log('✅ Data successfully written to Google Sheets')
    return {
      success: true,
      message: 'Data written to Google Sheets',
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
    }
  } catch (error) {
    console.error('❌ Error writing to Google Sheets:', error.message)
    return {
      success: false,
      message: 'Failed to write to Google Sheets',
      error: error.message,
    }
  }
}

// Function to create headers in Google Sheets (run once)
async function createSheetsHeaders() {
  if (!sheets) {
    console.warn('⚠️  Google Sheets not configured')
    return
  }

  try {
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Phone',
      'Customer Number',
      'Problem Description',
      'Date of Issue',
      'Model',
      'Issue Exists',
      'Final Observation',
      'Technical Details',
      'Accept Terms',
      'Attachments',
      'Auth Type',
      'User/API Key',
      'Full Data JSON',
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      range: 'Sheet1!A1:P1',
      valueInputOption: 'RAW',
      resource: {
        values: [headers],
      },
    })

    console.log('✅ Headers created in Google Sheets')
  } catch (error) {
    console.error('❌ Error creating headers:', error.message)
  }
}

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

// 1. API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']

  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key required',
      message: 'Please provide x-api-key header',
    })
  }

  if (!validApiKeys.has(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API Key',
      message: 'The provided API key is not valid',
    })
  }

  // Add API key info to request
  req.apiKey = apiKey
  next()
}

// 2. Bearer Token (JWT) Authentication Middleware
const bearerTokenAuth = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Bearer token required',
      message: 'Please provide Authorization header with Bearer token',
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired',
    })
  }
}

// 3. Basic Authentication Middleware
const basicAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      error: 'Basic auth required',
      message: 'Please provide Authorization header with Basic auth',
    })
  }

  const base64Credentials = authHeader.substring(6) // Remove 'Basic ' prefix
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  if (!username || !password) {
    return res.status(401).json({
      error: 'Invalid credentials format',
      message: 'Username and password are required',
    })
  }

  // Find user
  const user = users.find((u) => u.username === username)
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
    })
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
    })
  }

  req.user = { id: user.id, username: user.username }
  next()
}

// ===========================================
// UTILITY ROUTES
// ===========================================

// Root route with documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Authentication Demo API - Multi-Auth Integration Platform',
    unified_endpoints: {
      'POST /api/leads':
        'Main integration endpoint - accepts ANY auth type (API Key, Bearer Token, Basic Auth, or No Auth)',
      'POST /api/webhook':
        'Webhook endpoint - accepts ANY auth type (API Key, Bearer Token, Basic Auth, or No Auth)',
      'POST /api/data':
        'Generic data processing endpoint - accepts ANY auth type (API Key, Bearer Token, Basic Auth, or No Auth)',
      'POST /api/setup-sheets': 'Setup Google Sheets headers (run once)',
      'GET /api/test-sheets': 'Test Google Sheets connection',
    },
    individual_endpoints: {
      'GET /': 'This documentation',
      'POST /auth/login': 'Login to get JWT token',
      'GET /api-key/protected': 'API Key protected route (x-api-key header)',
      'GET /bearer/protected':
        'Bearer token protected route (Authorization: Bearer <token>)',
      'GET /basic/protected':
        'Basic auth protected route (Authorization: Basic <base64>)',
      'GET /auth/test-credentials': 'Get test credentials for demo',
    },
    authentication_examples: {
      api_key: {
        header: 'x-api-key',
        example: 'x-api-key: api_key_12345',
      },
      bearer_token: {
        header: 'Authorization',
        example: 'Authorization: Bearer <your-jwt-token>',
      },
      basic_auth: {
        header: 'Authorization',
        example: 'Authorization: Basic <base64-encoded-username:password>',
      },
      no_auth: {
        header: 'None',
        example: 'No authentication headers required',
      },
    },
    integration_workflow: {
      description:
        'For integration platforms - users configure their auth type (including no auth), then your app forwards data to the unified endpoints',
      example_usage:
        'POST /api/leads with any auth type (or no auth) - the endpoint automatically detects and validates the auth method',
      google_sheets:
        'All lead data is automatically stored in Google Sheets with timestamp and full request data',
    },
  })
})

// Get test credentials
app.get('/auth/test-credentials', (req, res) => {
  res.json({
    message: 'Test credentials for demo',
    api_keys: ['api_key_12345', 'api_key_67890', 'api_key_abcdef'],
    basic_auth: {
      username: 'admin',
      password: 'password',
      base64_encoded: 'YWRtaW46cGFzc3dvcmQ=', // admin:password
    },
    bearer_token: {
      note: 'Use POST /auth/login to get a JWT token',
      login_credentials: {
        username: 'admin',
        password: 'password',
      },
    },
  })
})

// Login endpoint to generate JWT token
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Username and password are required',
    })
  }

  // Find user
  const user = users.find((u) => u.username === username)
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
    })
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect',
    })
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  })

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username },
    expires_in: '1 hour',
  })
})

// ===========================================
// DYNAMIC AUTHENTICATION MIDDLEWARE
// ===========================================

// Dynamic auth middleware that detects auth type from headers
const dynamicAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const apiKey = req.headers['x-api-key']

  try {
    // Check for API Key first
    if (apiKey) {
      if (!validApiKeys.has(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API Key',
          message: 'The provided API key is not valid',
        })
      }
      req.authType = 'API Key'
      req.apiKey = apiKey
      return next()
    }

    // Check for Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.authType = 'Bearer Token'
        req.user = decoded
        return next()
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid Bearer token',
          message: 'The provided token is invalid or expired',
        })
      }
    }

    // Check for Basic Auth
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.substring(6)
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'ascii'
      )
      const [username, password] = credentials.split(':')

      if (!username || !password) {
        return res.status(401).json({
          error: 'Invalid Basic auth format',
          message: 'Username and password are required',
        })
      }

      const user = users.find((u) => u.username === username)
      if (!user) {
        return res.status(401).json({
          error: 'Invalid Basic auth credentials',
          message: 'Username or password is incorrect',
        })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid Basic auth credentials',
          message: 'Username or password is incorrect',
        })
      }

      req.authType = 'Basic Auth'
      req.user = { id: user.id, username: user.username }
      return next()
    }

    // No authentication provided - allow with "No Auth" type
    req.authType = 'No Auth'
    req.user = { id: null, username: 'anonymous' }
    next()
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    })
  }
}

// ===========================================
// UNIFIED INTEGRATION ENDPOINT
// ===========================================

// Main integration endpoint that handles all auth types
app.post('/api/leads', dynamicAuth, async (req, res) => {
  // This is your main integration endpoint
  // It automatically detects and handles any auth type INCLUDING no auth

  const leadData = req.body
  const authInfo = {
    auth_type: req.authType,
    user: req.user,
    api_key: req.apiKey,
  }

  // Store data to Google Sheets BEFORE returning response
  const sheetsResult = await appendToGoogleSheets(leadData, authInfo)

  // Process the lead data here
  const processedLead = {
    id: Math.random().toString(36).substr(2, 9),
    ...leadData,
    status: 'received',
    timestamp: new Date().toISOString(),
    processed_by: req.user?.username || 'anonymous',
  }

  // You can add your business logic here:
  // - Save to database
  // - Send to external services
  // - Trigger workflows
  // - Send notifications

  res.json({
    message: 'Lead processed successfully',
    auth_type: req.authType,
    lead_id: processedLead.id,
    authenticated_user: req.user || { api_key: req.apiKey },
    processed_data: processedLead,
    sheets_result: sheetsResult,
    timestamp: new Date().toISOString(),
  })
})

// Alternative endpoint with different path
app.post('/api/webhook', dynamicAuth, async (req, res) => {
  // Another integration endpoint for webhook-style integrations
  const webhookData = req.body
  const authInfo = {
    auth_type: req.authType,
    user: req.user,
    api_key: req.apiKey,
  }

  // Store to Google Sheets
  const sheetsResult = await appendToGoogleSheets(webhookData, authInfo)

  res.json({
    message: 'Webhook received and processed',
    auth_type: req.authType,
    webhook_id: Math.random().toString(36).substr(2, 9),
    authenticated_user: req.user || { api_key: req.apiKey },
    received_data: webhookData,
    sheets_result: sheetsResult,
    timestamp: new Date().toISOString(),
  })
})

// Generic data processing endpoint
app.post('/api/data', dynamicAuth, async (req, res) => {
  // Generic endpoint that can handle any type of data
  const inputData = req.body
  const authInfo = {
    auth_type: req.authType,
    user: req.user,
    api_key: req.apiKey,
  }

  // Store to Google Sheets
  const sheetsResult = await appendToGoogleSheets(inputData, authInfo)

  // Add processing logic based on your needs
  const result = {
    id: Math.random().toString(36).substr(2, 9),
    original_data: inputData,
    processed_at: new Date().toISOString(),
    processed_by: req.user?.username || 'anonymous',
    auth_method: req.authType,
  }

  res.json({
    message: 'Data processed successfully',
    auth_type: req.authType,
    result: result,
    sheets_result: sheetsResult,
    timestamp: new Date().toISOString(),
  })
})

// Endpoint to manually create headers in Google Sheets
app.post('/api/setup-sheets', (req, res) => {
  createSheetsHeaders()
  res.json({
    message: 'Google Sheets headers setup initiated',
    note: 'Check server logs for results',
  })
})

// Endpoint to test Google Sheets connection
app.get('/api/test-sheets', async (req, res) => {
  if (!sheets) {
    return res.json({
      success: false,
      message: 'Google Sheets not configured',
      note: 'Set environment variables for Google Sheets integration',
    })
  }

  try {
    const testData = {
      name: 'Test Lead',
      email: 'test@example.com',
      phone: '+1234567890',
      timestamp: new Date().toISOString(),
    }

    const result = await appendToGoogleSheets(testData, {
      auth_type: 'No Auth',
      user: { username: 'test' },
    })

    res.json({
      success: true,
      message: 'Google Sheets connection test',
      result: result,
    })
  } catch (error) {
    res.json({
      success: false,
      message: 'Google Sheets test failed',
      error: error.message,
    })
  }
})

// ===========================================
// LEGACY INDIVIDUAL AUTH ENDPOINTS (for reference)
// ===========================================

// 1. API Key Protected Route
app.get('/api-key/protected', apiKeyAuth, (req, res) => {
  res.json({
    message: 'Access granted via API Key!',
    auth_type: 'API Key',
    api_key: req.apiKey,
    timestamp: new Date().toISOString(),
    data: {
      secret: 'This is protected data accessible with API key',
      user_level: 'api_consumer',
    },
  })
})

// 2. Bearer Token Protected Route
app.get('/bearer/protected', bearerTokenAuth, (req, res) => {
  res.json({
    message: 'Access granted via Bearer Token!',
    auth_type: 'Bearer Token (JWT)',
    user: req.user,
    timestamp: new Date().toISOString(),
    data: {
      secret: 'This is protected data accessible with JWT token',
      user_level: 'authenticated_user',
    },
  })
})

// 3. Basic Auth Protected Route
app.get('/basic/protected', basicAuth, (req, res) => {
  res.json({
    message: 'Access granted via Basic Authentication!',
    auth_type: 'Basic Auth',
    user: req.user,
    timestamp: new Date().toISOString(),
    data: {
      secret: 'This is protected data accessible with Basic auth',
      user_level: 'basic_authenticated',
    },
  })
})

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    available_endpoints: [
      'GET /',
      'POST /auth/login',
      'GET /api-key/protected',
      'GET /bearer/protected',
      'GET /basic/protected',
    ],
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server',
  })
})

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
  console.log(`🚀 Authentication Demo Server running on port ${PORT}`)
  console.log(`📖 Documentation: http://localhost:${PORT}/`)
  console.log(
    `🔑 Test credentials: http://localhost:${PORT}/auth/test-credentials`
  )
  console.log('\n📋 Available endpoints:')
  console.log('  • GET  /                     - API documentation')
  console.log('  • POST /auth/login           - Login to get JWT token')
  console.log('  • GET  /api-key/protected    - API Key protected route')
  console.log('  • GET  /bearer/protected     - Bearer token protected route')
  console.log('  • GET  /basic/protected      - Basic auth protected route')
  console.log('\n🧪 Test the authentication:')
  console.log(
    '  1. API Key: curl -H "x-api-key: api_key_12345" http://localhost:3000/api-key/protected'
  )
  console.log(
    '  2. Basic Auth: curl -u admin:password http://localhost:3000/basic/protected'
  )
  console.log(
    '  3. Bearer Token: First login, then use the token in Authorization header'
  )
})
