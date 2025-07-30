
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminPanel } from '@/components/admin/admin-panel';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export interface UserData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive'; // Assuming status comes from somewhere
}

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Redirect if not logged in or not an admin
      if (!user || userProfile?.role !== 'admin') {
        router.push('/');
      } else {
        // Fetch users from Firestore
        const fetchUsers = async () => {
          setIsLoadingUsers(true);
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
                // Status would likely come from another field in your Firestore doc
                status: 'active',
              } as UserData;
          });
          setUsers(userList);
          setIsLoadingUsers(false);
        };
        fetchUsers();
      }
    }
  }, [user, userProfile, loading, router]);


  if (loading || isLoadingUsers) {
    return (
        <div className="container mx-auto">
            <header className="mb-6">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="mt-2 h-5 w-80" />
            </header>
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }
  
  if (userProfile?.role !== 'admin') {
     return (
      <div className="container mx-auto">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e configurações do sistema.
        </p>
      </header>
      <AdminPanel users={users} />
    </div>
  );
}
