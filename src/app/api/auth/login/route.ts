import { NextResponse } from 'next/server';

const USERS = {
  'sebastian': 'npp481',
  'andres': 'fzn942',
  'persona encargada': 'icefriohielo'
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const normalizedUser = username.toLowerCase().trim();
    
    if (USERS[normalizedUser as keyof typeof USERS] === password) {
      const response = NextResponse.json({ success: true, user: normalizedUser });
      
      // Set the session cookie (accessible to JS for displaying username)
      response.cookies.set('koolt_user', normalizedUser, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      response.cookies.set('koolt_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return response;
    }

    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
