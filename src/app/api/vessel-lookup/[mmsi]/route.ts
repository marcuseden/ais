import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { globalVesselLookup } from '@/lib/globalVesselLookup';

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

    // Perform global lookup
    const vesselData = await globalVesselLookup(mmsi);

    if (!vesselData) {
      return NextResponse.json({
        mmsi,
        found: false,
        message: 'No data found in global registries. Vessel may be private or not yet indexed.',
      });
    }

    return NextResponse.json({
      found: true,
      ...vesselData,
    });
  } catch (error) {
    console.error('Error in vessel lookup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

