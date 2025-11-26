import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';

export function useAuthCookie() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário logado - criar cookie de sessão
        const token = await user.getIdToken();

        // Enviar token para API route que criará o cookie
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      } else {
        // Usuário deslogado - remover cookie
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      }
    });

    return () => unsubscribe();
  }, []);
}
