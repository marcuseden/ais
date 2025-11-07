import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's alert rules
    const { data: rulesData, error: rulesError } = await supabaseAdmin
      .from('alert_rules')
      .select('*, geofences(name)')
      .eq('owner', user.id)
      .order('created_at', { ascending: false });

    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }

    const rules = rulesData as any[];

    // Get recent alert events for user's rules
    const ruleIds = rules?.map(r => r.id) || [];
    let events: any[] = [];
    
    if (ruleIds.length > 0) {
      const { data: eventsData, error: eventsError } = await supabaseAdmin
        .from('alert_events')
        .select('*')
        .in('rule_id', ruleIds)
        .order('event_ts', { ascending: false })
        .limit(50);

      if (eventsError) {
        return NextResponse.json({ error: eventsError.message }, { status: 500 });
      }

      events = eventsData || [];
    }

    return NextResponse.json({ rules, events });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, geofence_id } = body;

    if (!name || !geofence_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: ruleData, error } = await (supabaseAdmin
      .from('alert_rules')
      .insert as any)({
        owner: user.id,
        name,
        geofence_id,
        is_active: true,
      })
      .select()
      .single();

    const rule = ruleData as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

