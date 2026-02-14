import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export async function GET(request: NextRequest) {
  const debug = request.nextUrl.searchParams.get('debug') === '1';

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: 'Missing Google OAuth credentials',
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        redirectUri: redirectUri || 'not set',
      }, { status: 500 });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      include_granted_scopes: true,
    });

    if (debug) {
      return NextResponse.json({
        authUrl: url,
        clientId: clientId.substring(0, 20) + '...',
        redirectUri,
        scopes: SCOPES,
      });
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Google OAuth init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize OAuth', details: String(error) },
      { status: 500 }
    );
  }
}
