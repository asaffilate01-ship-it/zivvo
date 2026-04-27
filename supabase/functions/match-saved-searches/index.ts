// Hourly matcher: notifies users when new listings match a saved search.
// Triggered by pg_cron. Uses service role to bypass RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: Record<string, any>
  last_notified_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Get all active saved searches with notify=true
    const { data: searches, error: sErr } = await supabase
      .from('saved_searches')
      .select('id, user_id, name, filters, last_notified_at')
      .eq('notify', true)

    if (sErr) throw sErr
    if (!searches || searches.length === 0) {
      return json({ ok: true, processed: 0, message: 'no active searches' })
    }

    let totalNotified = 0
    const now = new Date().toISOString()

    for (const s of searches as SavedSearch[]) {
      const f = s.filters || {}

      // Build query for listings created since last_notified_at
      let q = supabase
        .from('car_listings')
        .select('id, title, price', { count: 'exact' })
        .eq('status', 'active')
        .gt('created_at', s.last_notified_at)
        .limit(5)

      if (f.make) q = q.eq('make', f.make)
      if (f.model) q = q.eq('model', f.model)
      if (f.body) q = q.eq('body_type', f.body)
      if (f.fuel) q = q.eq('fuel_type', f.fuel)
      if (f.transmission) q = q.eq('transmission', f.transmission)
      if (f.color) q = q.eq('color', f.color)
      if (f.priceMin) q = q.gte('price', Number(f.priceMin))
      if (f.priceMax && Number(f.priceMax) < 200000) q = q.lte('price', Number(f.priceMax))
      if (f.yearMin) q = q.gte('year', Number(f.yearMin))
      if (f.yearMax) q = q.lte('year', Number(f.yearMax))
      if (f.mileageMax && Number(f.mileageMax) < 200000) q = q.lte('mileage', Number(f.mileageMax))
      if (f.verified === true || f.verified === 'true') q = q.eq('verified', true)
      if (f.seller === 'Dealer') q = q.not('dealer_id', 'is', null)
      else if (f.seller === 'Private') q = q.is('dealer_id', null)

      const { data: matches, count } = await q

      if (matches && matches.length > 0) {
        // Build query string to resume the search
        const params = new URLSearchParams()
        Object.entries(f).forEach(([k, v]) => {
          if (v != null && v !== '' && v !== false) params.set(k, String(v))
        })
        const link = `/browse?${params.toString()}`

        const message = count === 1
          ? `1 new car matches "${s.name}"`
          : `${count} new cars match "${s.name}"`

        await supabase.from('notifications').insert({
          user_id: s.user_id,
          type: 'saved_search',
          title: 'New matches for your search',
          message,
          link,
        })
        totalNotified++
      }

      // Always advance last_notified_at so next run only checks newer listings
      await supabase
        .from('saved_searches')
        .update({ last_notified_at: now })
        .eq('id', s.id)
    }

    return json({ ok: true, processed: searches.length, notified: totalNotified })
  } catch (err) {
    console.error('match-saved-searches error', err)
    return json({ ok: false, error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
