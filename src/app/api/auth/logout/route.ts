import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('koolt_user');
  response.cookies.delete('koolt_session');
  
  return response;
}
