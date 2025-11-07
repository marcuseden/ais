// SMS notification service using Twilio
// For sending alerts to Erik when vessels enter Baltic Sea

import { supabaseAdmin } from './supabaseAdmin';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ERIK_PHONE = '+46738484828'; // Erik's number

interface SMSParams {
  vesselName: string;
  mmsi: number;
  shipType?: string;
  alertEventId?: number;
}

export async function sendErikAlert({ vesselName, mmsi, shipType, alertEventId }: SMSParams) {
  const message = `Hi Erik, commercial vessel "${vesselName}" (MMSI: ${mmsi}${shipType ? `, ${shipType}` : ''}) just entered the Baltic Sea.`;

  try {
    // Log to database first
    const { data: log, error: logError } = await supabaseAdmin
      .from('sms_notifications')
      .insert({
        recipient_phone: ERIK_PHONE,
        message_text: message,
        vessel_mmsi: mmsi,
        vessel_name: vesselName,
        alert_event_id: alertEventId,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log SMS:', logError);
      return { success: false, error: logError.message };
    }

    // Send SMS via Twilio if configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log('⚠️  Twilio not configured - SMS logged but not sent');
      console.log(`📱 Would send to ${ERIK_PHONE}: ${message}`);
      
      // Update status to 'sent' for demo purposes
      await supabaseAdmin
        .from('sms_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', log.id);

      return { success: true, demo: true, message };
    }

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: ERIK_PHONE,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio error: ${error}`);
    }

    // Update status to sent
    await supabaseAdmin
      .from('sms_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', log.id);

    console.log(`✅ SMS sent to Erik about ${vesselName}`);
    return { success: true, message };

  } catch (error) {
    console.error('❌ SMS send failed:', error);
    
    // Log failure
    await supabaseAdmin
      .from('sms_notifications')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('vessel_mmsi', mmsi)
      .eq('status', 'pending');

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if we've already sent alert for this vessel recently (avoid spam)
export async function shouldSendAlert(mmsi: number): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabaseAdmin
    .from('sms_notifications')
    .select('id')
    .eq('vessel_mmsi', mmsi)
    .eq('status', 'sent')
    .gte('sent_at', oneHourAgo)
    .limit(1);

  if (error) {
    console.error('Error checking alert history:', error);
    return true; // Default to sending if we can't check
  }

  return !data || data.length === 0; // Send only if no recent alert
}

