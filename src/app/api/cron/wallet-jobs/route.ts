import { NextRequest, NextResponse } from 'next/server'
import { fetchDueJobs, markJobAttemptFailed, markJobDone } from '@/lib/wallet-job-queue'
import { updateGoogleWalletObject, regenerateApplePass } from '@/lib/wallet-updates'
import { sendApnsPush } from '@/lib/apple-apns'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await fetchDueJobs()
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No wallet jobs to process', processed: 0 })
    }

    let processed = 0
    let failed = 0

    for (const job of jobs) {
      try {
        if (job.job_type === 'google_patch') {
          const { objectId, balance } = job.payload
          const patchBody = { loyaltyPoints: { balance: { int: parseInt(balance || 0) } } }
          const res = await updateGoogleWalletObject(objectId, patchBody)
          if (!res.success) throw new Error(res.error || 'Google patch failed')
          await markJobDone(job.id)
          processed++
        } else if (job.job_type === 'regenerate_pkpass') {
          const { passId, deviceToken } = job.payload
          const { data: pass } = await supabase
            .from('passes')
            .select('*')
            .eq('id', passId)
            .single()

          if (!pass) throw new Error('Pass not found')

          const ares = await regenerateApplePass(pass)
          if (!ares.success) throw new Error(ares.error || 'Regenerate failed')

          if (deviceToken) {
            const pres = await sendApnsPush(ares.serialNumber || pass.object_id, deviceToken)
            if (!pres || !(pres as any).success) throw new Error('APNS send failed')
          }

          await markJobDone(job.id)
          processed++
        } else {
          // Unknown job type, mark as done to avoid reprocessing
          await markJobDone(job.id)
          processed++
        }
      } catch (err: any) {
        console.error('Job failed', job.id, err)
        failed++

        const attempts = (job.attempts || 0) + 1
        if (attempts >= (job.max_attempts || 5)) {
          // Max retries reached, mark as done to prevent infinite retries
          await markJobDone(job.id)
        } else {
          // Exponential backoff: 1min, 2min, 4min, 8min, 16min
          const backoffSeconds = Math.pow(2, attempts) * 60
          await markJobAttemptFailed(job.id, attempts, backoffSeconds)
        }
      }
    }

    return NextResponse.json({
      message: 'Wallet jobs processing complete',
      processed,
      failed,
      total: jobs.length
    })
  } catch (error: any) {
    console.error('Cron worker error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
