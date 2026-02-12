import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Fetch notifications
    const { data: notifications, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Fetch notification preferences
    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      notifications: notifications || [],
      preferences: preferences || null,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('[Notifications] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId, preferences } = body;

    if (action === 'mark_read' && notificationId) {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true });
    }

    if (action === 'mark_all_read') {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      return NextResponse.json({ success: true });
    }

    if (action === 'update_preferences' && preferences) {
      const allowedFields = [
        'email_new_gir', 'email_booking_confirmation', 'email_price_changes',
        'email_availability_alerts', 'email_commission_updates',
        'email_newsletter', 'email_marketing', 'in_app_notifications',
      ];

      const updateData: Record<string, boolean> = {};
      for (const field of allowedFields) {
        if (typeof preferences[field] === 'boolean') {
          updateData[field] = preferences[field];
        }
      }

      await supabaseAdmin
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updateData,
        }, { onConflict: 'user_id' });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error) {
    console.error('[Notifications] PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
