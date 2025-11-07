import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isInBBox } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bboxParam = searchParams.get('bbox');

    console.log('Fetching vessels from database...');

    let query = supabaseAdmin
      .from('vessels')
      .select('*')
      .not('last_lat', 'is', null)
      .not('last_lng', 'is', null)
      .order('last_seen', { ascending: false })
      .limit(500);

    const { data: vesselsData, error } = await query;

    if (error) {
      console.error('Error fetching vessels:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vessels = vesselsData as any[];
    console.log(`Found ${vessels?.length || 0} vessels in database`);

    // Filter by bbox if provided (format: minLng,minLat,maxLng,maxLat)
    let filteredVessels = vessels || [];
    if (bboxParam) {
      const [minLng, minLat, maxLng, maxLat] = bboxParam.split(',').map(Number);
      const bbox = { minLat, minLng, maxLat, maxLng };
      filteredVessels = filteredVessels.filter(v => 
        v.last_lat !== null && v.last_lng !== null &&
        isInBBox(v.last_lat, v.last_lng, bbox)
      );
      console.log(`Filtered to ${filteredVessels.length} vessels in bbox`);
    }

    // Transform to match VesselPosition interface
    const transformedVessels = filteredVessels.map(v => ({
      mmsi: v.mmsi,
      name: v.name,
      ship_type: v.ship_type,
      lat: v.last_lat,
      lng: v.last_lng,
      sog: v.sog,
      cog: v.cog,
      ts: v.last_seen,
    }));

    console.log(`Returning ${transformedVessels.length} vessels to client`);

    return NextResponse.json({
      vessels: transformedVessels,
      count: transformedVessels.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

