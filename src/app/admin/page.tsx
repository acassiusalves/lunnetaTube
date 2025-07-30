import { AdminPanel } from '@/components/admin/admin-panel';

export default function AdminPage() {
  // In a real app, you would have logic here to check if the user is an admin.
  // If not, you would redirect them to another page.
  // For this example, we'll assume the check passes and render the panel.

  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e configurações do sistema.
        </p>
      </header>
      <AdminPanel />
    </div>
  );
}
