import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Tempo de expiração do cookie (5 dias em segundos)
const MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    // Criar cookie de sessão
    const cookieStore = await cookies();
    cookieStore.set('__session', token, {
      maxAge: MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Remover cookie de sessão
    const cookieStore = await cookies();
    cookieStore.delete('__session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover sessão:', error);
    return NextResponse.json({ error: 'Erro ao remover sessão' }, { status: 500 });
  }
}
