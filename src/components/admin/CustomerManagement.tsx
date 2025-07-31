import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Edit, Trash2, Plus, Eye } from 'lucide-react';
import api from '@/services/api';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  store_owner_id: string;
  created_at: string;
  updated_at: string;
}

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ApiError {
  error: string;
  details?: Array<{
    code: string;
    message: string;
    path: string[];
  }>;
}

const CustomerManagement = () => {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Buscar clientes
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await api.get('/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          toast({
            title: 'Erro de Autenticação',
            description: 'Sessão expirada. Faça login novamente.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Erro ao carregar clientes',
            description: 'Não foi possível carregar a lista de clientes.',
            variant: 'destructive'
          });
        }
        throw error;
      }
    },
    enabled: !!token
  });

  // Filtrar clientes por busca
  const filteredCustomers = customers.filter((customer: Customer) => {
    const searchLower = searchTerm.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) ||
           customer.phone.includes(searchTerm) ||
           (customer.email && customer.email.toLowerCase().includes(searchLower));
  });

  // Verificar se email já existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) return false;
    
    try {
      setIsCheckingEmail(true);
      const response = await api.get(`/customers?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.length > 0;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      console.error('Erro ao verificar email:', error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Criar cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        ...data,
        store_owner_id: user?.id || ''
      };

      const response = await api.post('/customers', customerData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Cliente criado',
        description: 'Cliente criado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      handleApiError(error, 'criar cliente');
    }
  });

  // Atualizar cliente
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormData }) => {
      const customerData = {
        ...data,
        store_owner_id: user?.id || ''
      };

      const response = await api.put(`/customers/${id}`, customerData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Cliente atualizado',
        description: 'Cliente atualizado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowEditDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      handleApiError(error, 'atualizar cliente');
    }
  });

  // Deletar cliente
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Cliente deletado',
        description: 'Cliente deletado com sucesso!',
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      handleApiError(error, 'deletar cliente');
    }
  });

  // Tratar erros da API
  const handleApiError = (error: any, action: string) => {
    console.error(`Erro ao ${action}:`, error);
    
    if (error.response?.status === 401) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Sessão expirada. Faça login novamente.',
        variant: 'destructive'
      });
      return;
    }

    if (error.response?.status === 400) {
      const apiError: ApiError = error.response.data;
      
      if (apiError.error === 'Email já está em uso') {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está sendo usado por outro cliente.',
          variant: 'destructive'
        });
        return;
      }

      if (apiError.details && apiError.details.length > 0) {
        const errorMessages = apiError.details.map(detail => detail.message).join(', ');
        toast({
          title: 'Dados inválidos',
          description: errorMessages,
          variant: 'destructive'
        });
        return;
      }
    }

    if (error.response?.status === 404) {
      toast({
        title: 'Cliente não encontrado',
        description: 'O cliente solicitado não foi encontrado.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: `Erro ao ${action}`,
      description: 'Ocorreu um erro inesperado. Tente novamente.',
      variant: 'destructive'
    });
  };

  // Validar formulário
  const validateForm = (data: CustomerFormData): string[] => {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!data.phone.trim()) {
      errors.push('Telefone é obrigatório');
    } else {
      const phoneRegex = /^[\d\s\(\)\-\+]+$/;
      if (!phoneRegex.test(data.phone.replace(/\D/g, ''))) {
        errors.push('Telefone deve conter apenas números, espaços, parênteses, hífens e +');
      }
    }

    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email deve ter um formato válido');
      }
    }

    return errors;
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setSelectedCustomer(null);
  };

  // Abrir diálogo de edição
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setShowEditDialog(true);
  };

  // Abrir diálogo de exclusão
  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };

  // Submeter criação
  const handleCreateSubmit = async () => {
    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast({
        title: 'Dados inválidos',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    // Verificar se email já existe (se fornecido)
    if (formData.email.trim()) {
      const emailExists = await checkEmailExists(formData.email.trim());
      if (emailExists) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está sendo usado por outro cliente.',
          variant: 'destructive'
        });
        return;
      }
    }

    createCustomerMutation.mutate(formData);
  };

  // Submeter edição
  const handleEditSubmit = async () => {
    if (!selectedCustomer) return;

    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast({
        title: 'Dados inválidos',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    // Verificar se email já existe (se fornecido e diferente do atual)
    if (formData.email.trim() && formData.email !== selectedCustomer.email) {
      const emailExists = await checkEmailExists(formData.email.trim());
      if (emailExists) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está sendo usado por outro cliente.',
          variant: 'destructive'
        });
        return;
      }
    }

    updateCustomerMutation.mutate({
      id: selectedCustomer.id,
      data: formData
    });
  };

  // Confirmar exclusão
  const handleDeleteConfirm = () => {
    if (!selectedCustomer) return;
    deleteCustomerMutation.mutate(selectedCustomer.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar clientes</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Clientes</h1>
        <p className="text-gray-600">Gerencie todos os clientes cadastrados no sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Email</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter((c: Customer) => c.email).length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Endereço</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter((c: Customer) => c.address).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os clientes cadastrados
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente. Nome e telefone são obrigatórios.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Endereço completo"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateSubmit}
                    disabled={createCustomerMutation.isPending || isCheckingEmail}
                  >
                    {createCustomerMutation.isPending ? 'Criando...' : 'Criar Cliente'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      {customer.email ? (
                        <span className="text-blue-600">{customer.email}</span>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.address ? (
                        <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                          {customer.address}
                        </span>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize os dados do cliente selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={updateCustomerMutation.isPending || isCheckingEmail}
            >
              {updateCustomerMutation.isPending ? 'Atualizando...' : 'Atualizar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente "{selectedCustomer?.name}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? 'Excluindo...' : 'Excluir Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement; 