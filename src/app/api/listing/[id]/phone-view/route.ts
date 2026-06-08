import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  await supabase.rpc('increment_phone_views', { listing_id: params.id })
  return NextResponse.json({ ok: true })
}
