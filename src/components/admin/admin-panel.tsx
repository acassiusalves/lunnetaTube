
'use client';

import { useState } from 'react';
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { Card } from '../ui/card';
import type { UserData } from '@/app/admin/page';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '../ui/alert-dialog';
import { deleteUser, updateUserRole } from '@/firebase/admin-actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface AdminPanelProps {
    users: UserData[];
    onUserUpdate: () => void;
}

export function AdminPanel({ users, onUserUpdate }: AdminPanelProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [newRole, setNewRole] = useState<'admin' | 'user' | null>(null);

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isEditDialogoOpen, setIsEditDialogoOpen] = useState(false);
    
    const openDeleteAlert = (user: UserData) => {
        setSelectedUser(user);
        setIsDeleteAlertOpen(true);
    };

    const openEditDialog = (user: UserData) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsEditDialogoOpen(true);
    };

    const handleRoleChange = (value: 'admin' | 'user') => {
        setNewRole(value);
    };

    const handleEditUser = async () => {
        if (!selectedUser || !newRole) return;
        
        setIsEditing(true);
        try {
            await updateUserRole({ userId: selectedUser.id, newRole });
            toast({
                title: 'Sucesso!',
                description: `A função de ${selectedUser.email} foi atualizada para ${newRole}.`,
            });
            onUserUpdate();
        } catch (error: any) {
            toast({
                title: 'Erro ao Editar',
                description: error.message || 'Não foi possível atualizar o usuário.',
                variant: 'destructive',
            });
        } finally {
            setIsEditing(false);
            setIsEditDialogoOpen(false);
            setSelectedUser(null);
        }
    };
    
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        setIsDeleting(true);
        try {
            await deleteUser({ userId: selectedUser.id });
            toast({
                title: 'Usuário Excluído',
                description: `O usuário ${selectedUser.email} foi removido com sucesso.`,
            });
            onUserUpdate();
        } catch (error: any) {
             toast({
                title: 'Erro ao Excluir',
                description: error.message || 'Não foi possível remover o usuário.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
            setSelectedUser(null);
        }
    };


  return (
    <>
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Função</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.whatsapp}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? <ShieldCheck className="mr-1 h-3 w-3" /> : <UserCheck className="mr-1 h-3 w-3" />}
                    {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Função
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openDeleteAlert(user)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {users.length === 0 && (
          <div className="text-center p-6 text-muted-foreground">
            Nenhum outro usuário encontrado.
          </div>
        )}
    </Card>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá excluir permanentemente a conta de <span className="font-semibold">{selectedUser?.email}</span> e remover seus dados de nossos servidores.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Excluir Usuário
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    {/* Edit Role Dialog */}
    <Dialog open={isEditDialogoOpen} onOpenChange={setIsEditDialogoOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Função do Usuário</DialogTitle>
                <DialogDescription>
                    Altere a função de <span className="font-semibold">{selectedUser?.email}</span>. Administradores podem gerenciar outros usuários.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <RadioGroup value={newRole || ''} onValueChange={handleRoleChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="r1" />
                        <Label htmlFor="r1">Usuário</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="r2" />
                        <Label htmlFor="r2">Administrador</Label>
                    </div>
                </RadioGroup>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleEditUser} disabled={isEditing || newRole === selectedUser?.role}>
                    {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
