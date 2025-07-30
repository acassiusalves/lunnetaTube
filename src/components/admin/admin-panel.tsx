
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '../ui/card';

// Mock data for users - in a real app, this would come from your database
const users = [
  {
    id: '1',
    name: 'Acassius Alves',
    email: 'acassiusalves@gmail.com',
    whatsapp: '+5511987654321',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    whatsapp: '+5521912345678',
    role: 'user',
    status: 'active',
  },
  {
    id: '3',
    name: 'João Pereira',
    email: 'joao.p@example.com',
    whatsapp: '+5531998761234',
    role: 'user',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    whatsapp: '+5551987659876',
    role: 'user',
    status: 'active',
  },
];

export function AdminPanel() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.whatsapp}</TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                  {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                    {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
