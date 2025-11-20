import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export type WalletJob = {
  id?: string
  type: 'apple_push' | 'google_patch' | 'regenerate_pkpass'
  payload: any
  attempts?: number
  max_attempts?: number
  next_run_at?: string | null
}

export async function enqueueJob(job: WalletJob) {
  const record = {
    type: job.type,
    payload: job.payload,
    attempts: job.attempts || 0,
    max_attempts: job.max_attempts || 5,
    next_run_at: job.next_run_at || new Date().toISOString(),
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase.from('wallet_push_jobs').insert(record).select().single()
  if (error) throw error
  return data
}

export async function fetchDueJobs(limit = 50) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('wallet_push_jobs')
    .select('*')
    .lte('next_run_at', now)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function markJobAttemptFailed(id: string, attempts: number, backoffSeconds = 60) {
  const next = new Date(Date.now() + backoffSeconds * 1000).toISOString()
  await supabase.from('wallet_push_jobs').update({ attempts, next_run_at: next }).eq('id', id)
}

export async function markJobDone(id: string) {
  await supabase.from('wallet_push_jobs').delete().eq('id', id)
}

export default { enqueueJob, fetchDueJobs, markJobAttemptFailed, markJobDone }
