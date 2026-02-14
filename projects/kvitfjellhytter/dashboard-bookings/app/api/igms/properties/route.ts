import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const IGMS_API_BASE = 'https://api.igms.com/v1';

interface IGMSProperty {
  uid: string;
  title: string;
  address?: string;
  city?: string;
  country?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from environment
    const accessToken = process.env.IGMS_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'iGMS not connected. Please connect via dashboard first.' },
        { status: 401 }
      );
    }

    // Fetch properties from iGMS
    const response = await fetch(`${IGMS_API_BASE}/properties`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('iGMS API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch properties from iGMS', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const properties: IGMSProperty[] = data.results || data.properties || [];

    // Store in Supabase
    const supabase = await createClient();
    
    const { data: existingData } = await supabase
      .from('igms_properties')
      .select('uid')
      .in('uid', properties.map(p => p.uid));
    
    const existingUids = new Set(existingData?.map(p => p.uid) || []);
    
    const propertiesToUpsert = properties.map(property => ({
      uid: property.uid,
      title: property.title,
      address: property.address,
      city: property.city,
      country: property.country,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.max_guests,
      raw_data: property,
      synced_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('igms_properties')
      .upsert(propertiesToUpsert, { onConflict: 'uid' });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to store properties', details: upsertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${properties.length} properties`,
      new: properties.length - existingUids.size,
      updated: existingUids.size,
    });

  } catch (error) {
    console.error('Property sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('igms_properties')
      .select('*')
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    return NextResponse.json({ properties: data || [] });

  } catch (error) {
    console.error('Property fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
