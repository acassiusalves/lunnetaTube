
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
        // Allow access for a moment to show the access denied message, then redirect if needed
        // router.push('/'); 
      } else {
        // Fetch users from Firestore
        const fetchUsers = async () => {
          setIsLoadingUsers(true);
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
                  // Status would likely come from another field in your Firestore doc
                  status: 'active',
                } as UserData;
            });
            setUsers(userList);
          } catch(error) {
            console.error("Error fetching users:", error);
            // Handle error (e.g., show a toast message)
          } finally {
            setIsLoadingUsers(false);
          }
        };
        fetchUsers();
      }
    }
  }, [user, userProfile, loading, router]);


  if (loading || (userProfile?.role === 'admin' && isLoadingUsers)) {
    return (
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
                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
  }
  
  if (!user || userProfile?.role !== 'admin') {
     return (
      <div className="container mx-auto">
        <Alert variant="destructive" className="max-w-md mx-auto">
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
      {isLoadingUsers ? (
         <p>Carregando usuários...</p>
      ) : (
        <AdminPanel users={users} />
      )}
    </div>
  );
}

    