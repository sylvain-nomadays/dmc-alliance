/**
 * Admin Newsletter Subscribers API
 * GET - List subscribers with filters
 * POST - Import subscribers from CSV
 * DELETE - Delete a subscriber
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ImportedSubscriber {
  email: string;
  company_name?: string;
  locale?: string;
  interests?: string[];
  source?: string;
}

// GET - List subscribers with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');
    const locale = searchParams.get('locale');
    const source = searchParams.get('source');

    const offset = (page - 1) * limit;

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }
    if (locale) {
      query = query.eq('locale', locale);
    }
    if (source) {
      query = query.eq('source', source);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[Admin Newsletter] List error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribers: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('[Admin Newsletter] List error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Import subscribers from CSV
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { subscribers, skipDuplicates = true } = body as {
      subscribers: ImportedSubscriber[];
      skipDuplicates?: boolean;
    };

    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers provided' },
        { status: 400 }
      );
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validSubscribers = subscribers.filter(s =>
      s.email && emailRegex.test(s.email.toLowerCase().trim())
    );

    if (validSubscribers.length === 0) {
      return NextResponse.json(
        { error: 'No valid emails found' },
        { status: 400 }
      );
    }

    // Get existing emails
    const emails = validSubscribers.map(s => s.email.toLowerCase().trim());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingData } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set(
      (existingData || []).map((d: { email: string }) => d.email.toLowerCase())
    );

    // Prepare subscribers to insert
    const now = new Date().toISOString();
    const toInsert = validSubscribers
      .filter(s => !existingEmails.has(s.email.toLowerCase().trim()) || !skipDuplicates)
      .map(s => ({
        email: s.email.toLowerCase().trim(),
        company_name: s.company_name || null,
        locale: s.locale || 'fr',
        interests: s.interests || [],
        source: s.source || 'import',
        is_active: true, // Import as active (no double opt-in for B2B imports)
        confirmed_at: now, // Mark as confirmed
        created_at: now,
        updated_at: now,
      }));

    if (toInsert.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: validSubscribers.length,
        errors: 0,
        message: 'All emails already exist in the database',
      });
    }

    // Insert in batches of 100
    const batchSize = 100;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('newsletter_subscribers')
        .upsert(batch, {
          onConflict: 'email',
          ignoreDuplicates: skipDuplicates
        })
        .select();

      if (error) {
        console.error('[Admin Newsletter] Import batch error:', error);
        totalErrors += batch.length;
      } else {
        totalInserted += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      imported: totalInserted,
      skipped: existingEmails.size,
      errors: totalErrors,
      total: validSubscribers.length,
    });
  } catch (error) {
    console.error('[Admin Newsletter] Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subscriber
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return NextResponse.json(
        { error: 'Missing id or email parameter' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('newsletter_subscribers')
      .delete();

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    const { error } = await query;

    if (error) {
      console.error('[Admin Newsletter] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscriber' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Newsletter] Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a subscriber
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, is_active, interests, locale } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing subscriber id' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }
    if (interests) {
      updates.interests = interests;
    }
    if (locale) {
      updates.locale = locale;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('newsletter_subscribers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Newsletter] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update subscriber' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, subscriber: data });
  } catch (error) {
    console.error('[Admin Newsletter] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
