import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { is_active, name } = body;

    // Verify ownership
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('alert_rules')
      .select('owner')
      .eq('id', params.id)
      .single();

    const existing = existingData as any;

    if (fetchError || !existing || existing.owner !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update
    const updateData: any = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (name !== undefined) updateData.name = name;

    const { data: updatedData, error } = await (supabaseAdmin
      .from('alert_rules')
      .update as any)(updateData)
      .eq('id', params.id)
      .select()
      .single();

    const updated = updatedData as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingData2, error: fetchError } = await supabaseAdmin
      .from('alert_rules')
      .select('owner')
      .eq('id', params.id)
      .single();

    const existing2 = existingData2 as any;

    if (fetchError || !existing2 || existing2.owner !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('alert_rules')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

