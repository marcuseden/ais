import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedBalticGeofence() {
  console.log('Seeding Baltic Sea geofence...');

  // Load Baltic Sea polygon
  const balticPath = path.join(process.cwd(), 'src', 'lib', 'baltic.geojson');
  const balticData = JSON.parse(fs.readFileSync(balticPath, 'utf-8'));

  // Check if it already exists
  const { data: existing } = await supabase
    .from('geofences')
    .select('id')
    .eq('name', 'Baltic Sea (Östersjön)')
    .is('owner', null)
    .single();

  if (existing) {
    console.log('Baltic Sea geofence already exists');
    return existing.id;
  }

  // Insert the Baltic Sea geofence (system-owned, owner = null)
  const { data: geofence, error } = await supabase
    .from('geofences')
    .insert({
      owner: null,
      name: 'Baltic Sea (Östersjön)',
      region_geojson: balticData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating Baltic geofence:', error);
    throw error;
  }

  console.log('Baltic Sea geofence created:', geofence.id);
  return geofence.id;
}

async function createDefaultAlertForUsers(geofenceId: string) {
  console.log('Creating default alert rules for users...');

  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  for (const user of users) {
    // Check if user already has an alert for this geofence
    const { data: existing } = await supabase
      .from('alert_rules')
      .select('id')
      .eq('owner', user.id)
      .eq('geofence_id', geofenceId)
      .single();

    if (!existing) {
      const { error: alertError } = await supabase
        .from('alert_rules')
        .insert({
          owner: user.id,
          name: 'Entering Baltic Sea (Östersjön)',
          geofence_id: geofenceId,
          is_active: true,
        });

      if (alertError) {
        console.error(`Error creating alert for user ${user.id}:`, alertError);
      } else {
        console.log(`Created default alert for user ${user.email}`);
      }
    }
  }
}

async function main() {
  try {
    const geofenceId = await seedBalticGeofence();
    await createDefaultAlertForUsers(geofenceId);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();

