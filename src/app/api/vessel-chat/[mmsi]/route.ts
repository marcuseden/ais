import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Get or create chat for a vessel
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

    // Get or create chat
    let { data: chat } = await supabaseAdmin
      .from('vessel_chats')
      .select('*')
      .eq('vessel_mmsi', mmsi)
      .eq('created_by', user.id)
      .single();

    if (!chat) {
      // Get vessel name from vessels table
      const { data: vessel } = await supabaseAdmin
        .from('vessels')
        .select('name')
        .eq('mmsi', mmsi)
        .single();

      // Create new chat
      const { data: newChat, error: createError } = await (supabaseAdmin
        .from('vessel_chats')
        .insert as any)({
          vessel_mmsi: mmsi,
          vessel_name: vessel?.name || `Vessel ${mmsi}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      chat = newChat;
    }

    // Get messages
    const { data: messages } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('sent_at', { ascending: true });

    return NextResponse.json({
      chat,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send message in chat
export async function POST(
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

    const body = await request.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add message
    const { data: newMessage, error } = await (supabaseAdmin
      .from('chat_messages')
      .insert as any)({
        chat_id: chatId,
        sender_type: 'user',
        sender_id: user.id,
        message_text: message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update chat last_message_at
    await supabaseAdmin
      .from('vessel_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

