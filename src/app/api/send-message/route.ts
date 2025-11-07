import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Manual messaging endpoint - Erik decides to send, not automated
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mmsi, contactType, message } = body;

    if (!mmsi || !contactType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get vessel contact info
    const { data: contact } = await supabaseAdmin
      .from('vessel_contacts')
      .select('*')
      .eq('mmsi', mmsi)
      .single();

    if (!contact) {
      return NextResponse.json(
        { error: 'No contact information available for this vessel' },
        { status: 404 }
      );
    }

    // Check if vessel has opted in to receive messages
    if (!contact.can_receive_alerts && contact.data_source === 'opt_in') {
      return NextResponse.json(
        { error: 'Vessel owner has not opted in to receive messages' },
        { status: 403 }
      );
    }

    // For public registry data, require explicit consent per message
    if (contact.data_source === 'public_registry') {
      return NextResponse.json(
        { 
          error: 'Public registry contact - manual consent required',
          note: 'This contact info is from public records. You must obtain explicit consent before sending commercial messages.',
          contactInfo: {
            company: contact.company_name,
            email: contact.business_email,
            phone: contact.business_phone,
            source: contact.registry_source,
          }
        },
        { status: 403 }
      );
    }

    // Log the contact attempt (for GDPR compliance)
    await supabaseAdmin
      .from('contact_log')
      .insert({
        vessel_mmsi: mmsi,
        contact_type: contactType,
        initiated_by: user.id,
        message_content: message,
      });

    // TODO: Implement actual sending based on contactType
    // For now, just log it
    console.log(`📧 Message logged for vessel ${mmsi} (${contactType}):`, message);

    return NextResponse.json({
      success: true,
      message: 'Message logged. Manual sending required for compliance.',
      contactType,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

