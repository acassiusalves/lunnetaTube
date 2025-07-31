
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminPanel } from '@/components/admin/admin-panel';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';


export interface UserData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

const LoadingScreen = () => (
    <div className="container mx-auto">
        <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
            <p className="text-muted-foreground">
              Gerencie usuários e configurações do sistema.
            </p>
        </header>
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    </div>
);

const AccessDeniedScreen = () => (
    <div className="container mx-auto">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <Shield className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
                Você não tem permissão para acessar esta página. Verifique se você está logado com uma conta de administrador.
            </AlertDescription>
        </Alert>
    </div>
);


export default function AdminPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [pageState, setPageState] = useState<'loading' | 'denied' | 'success'>('loading');
  const router = useRouter();


  const fetchUsers = useCallback(async () => {
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'N/A',
          email: data.email,
          whatsapp: data.whatsapp,
          role: data.role,
          status: 'active', // Placeholder
        } as UserData;
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Se houver um erro ao buscar usuários, pode ser um problema de permissão.
      setPageState('denied');
    }
  }, []);
  
  useEffect(() => {
    // Se a autenticação ainda está carregando, espere.
    if (authLoading) {
      setPageState('loading');
      return;
    }

    // Se não há usuário logado após o carregamento, redirecione para o login.
    if (!user) {
        router.push('/login');
        return;
    }
    
    // Se há um usuário, mas o perfil (com a role) ainda não carregou, espere.
    if (!userProfile) {
        // Isso pode acontecer por um instante enquanto o perfil é buscado do Firestore.
        // A tela de loading continuará sendo exibida.
        return;
    }

    // Agora temos certeza que temos um usuário e um perfil.
    if (userProfile.role === 'admin') {
        setPageState('success');
        fetchUsers();
    } else {
        setPageState('denied');
    }
  }, [user, userProfile, authLoading, router, fetchUsers]);


  if (pageState === 'loading') {
    return <LoadingScreen />;
  }
  
  if (pageState === 'denied') {
     return <AccessDeniedScreen />;
  }

  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e configurações do sistema.
        </p>
      </header>
      <AdminPanel users={users} onUserUpdate={fetchUsers} />
    </div>
  );
}
