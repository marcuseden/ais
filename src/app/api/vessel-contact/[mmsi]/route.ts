import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { lookupVesselOwner } from '@/lib/vesselRegistry';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ mmsi: string }> }
) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mmsi = parseInt(params.mmsi);

    // Lookup vessel owner information
    const ownerInfo = await lookupVesselOwner(mmsi);

    // Log that Erik viewed this contact info (for GDPR compliance)
    await supabaseAdmin
      .from('contact_log')
      .insert({
        vessel_mmsi: mmsi,
        contact_type: 'viewed',
        initiated_by: user.id,
      });

    if (!ownerInfo) {
      return NextResponse.json({
        mmsi,
        available: false,
        message: 'No public registry data available. Vessel owner can opt-in to share contact info.',
      });
    }

    return NextResponse.json({
      mmsi,
      available: true,
      ...ownerInfo,
    });
  } catch (error) {
    console.error('Error fetching vessel contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

