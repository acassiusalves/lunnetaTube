import { NextRequest, NextResponse } from 'next/server';

// Simple encryption for sensitive data (base64 encoding for now)
// In production, use proper encryption like AES-256
function encrypt(text: string): string {
  return Buffer.from(text).toString('base64');
}

function decrypt(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Import Firestore functions dynamically to avoid server-side issues
    const { db } = await import('@/firebase/config');
    const { doc, getDoc } = await import('firebase/firestore');

    // Get credentials from Firestore
    const credentialsRef = doc(db, 'users', userId, 'settings', 'credentials');
    const credentialsDoc = await getDoc(credentialsRef);

    if (!credentialsDoc.exists()) {
      return NextResponse.json({ credentials: null });
    }

    const data = credentialsDoc.data();

    // Decrypt sensitive fields
    const credentials = {
      youtubeApiKey: data.youtubeApiKey ? decrypt(data.youtubeApiKey) : '',
      geminiApiKey: data.geminiApiKey ? decrypt(data.geminiApiKey) : '',
      facebookAccessToken: data.facebookAccessToken ? decrypt(data.facebookAccessToken) : '',
      aiModel: data.aiModel || 'gemini-1.5-flash',
      commentAnalysisPrompt: data.commentAnalysisPrompt || '',
    };

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Erro ao buscar credenciais' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, youtubeApiKey, geminiApiKey, facebookAccessToken, aiModel, commentAnalysisPrompt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Import Firestore functions dynamically to avoid server-side issues
    const { db } = await import('@/firebase/config');
    const { doc, setDoc } = await import('firebase/firestore');

    // Encrypt sensitive fields
    const encryptedData = {
      youtubeApiKey: youtubeApiKey ? encrypt(youtubeApiKey) : '',
      geminiApiKey: geminiApiKey ? encrypt(geminiApiKey) : '',
      facebookAccessToken: facebookAccessToken ? encrypt(facebookAccessToken) : '',
      aiModel: aiModel || 'gemini-1.5-flash',
      commentAnalysisPrompt: commentAnalysisPrompt || '',
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore
    const credentialsRef = doc(db, 'users', userId, 'settings', 'credentials');
    await setDoc(credentialsRef, encryptedData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving credentials:', error);
    return NextResponse.json({ error: 'Erro ao salvar credenciais' }, { status: 500 });
  }
}
