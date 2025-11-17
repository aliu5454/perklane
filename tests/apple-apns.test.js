const assert = require('assert')
const { sendApnsPush } = require('../src/lib/apple-apns')

(async () => {
  console.log('Running apple-apns basic test...')
  // Ensure env vars unset
  delete process.env.APPLE_APNS_KEY_ID
  delete process.env.APPLE_APNS_KEY
  delete process.env.APPLE_TEAM_ID
  delete process.env.APPLE_BUNDLE_ID

  const res = await sendApnsPush('SOME_SERIAL', 'SOME_DEVICE_TOKEN')
  assert(res && !res.success && res.error, 'Expected error when APNS config missing')
  console.log('apple-apns basic test passed')
})().catch(err => {
  console.error('Test failed', err)
  process.exit(1)
})
