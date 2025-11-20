#!/usr/bin/env node
const { fetchDueJobs, markJobAttemptFailed, markJobDone } = require('../src/lib/wallet-job-queue')

async function run() {
  const { fetchDueJobs: _fetch, markJobAttemptFailed: _fail, markJobDone: _done } = require('../src/lib/wallet-job-queue')
  const jobs = await _fetch()
  if (!jobs || jobs.length === 0) return console.log('No wallet jobs to process')

  const { updateGoogleWalletObject, regenerateApplePass } = require('../src/lib/wallet-updates')
  const { sendApnsPush } = require('../src/lib/apple-apns')

  for (const job of jobs) {
    try {
      if (job.type === 'google_patch') {
        const { objectId, balance } = job.payload
        const patchBody = { loyaltyPoints: { balance: { int: parseInt(balance || 0) } } }
        const res = await updateGoogleWalletObject(objectId, patchBody)
        if (!res.success) throw new Error(res.error || 'Google patch failed')
        await _done(job.id)
      } else if (job.type === 'regenerate_pkpass') {
        const { passId, deviceToken } = job.payload
        const supabase = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
        const { data: pass } = await supabase.from('passes').select('*').eq('id', passId).single()
        if (!pass) throw new Error('Pass not found')
        const ares = await regenerateApplePass(pass)
        if (!ares.success) throw new Error(ares.error || 'Regenerate failed')
        if (deviceToken) {
          const pres = await sendApnsPush(ares.serialNumber || pass.object_id, deviceToken)
          if (!pres || !pres.success) throw new Error('APNS send failed')
        }
        await _done(job.id)
      } else {
        // Unknown job type, delete
        await _done(job.id)
      }
    } catch (err) {
      console.error('Job failed', job.id, err)
      const attempts = (job.attempts || 0) + 1
      if (attempts >= (job.max_attempts || 5)) {
        // give up and delete
        await _done(job.id)
      } else {
        // exponential backoff
        const backoff = Math.pow(2, attempts) * 60
        await _fail(job.id, attempts, backoff)
      }
    }
  }
}

run().catch(err => {
  console.error('Worker error', err)
  process.exit(1)
})
