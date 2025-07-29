import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, DollarSign, Search, FileDown, MessageCircle, Calendar, MapPin, Phone, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancial } from "@/contexts/FinancialContext";
import ClientHistoryModal from "./ClientHistoryModal";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

type CreditAccount = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  total_debt: number;
  created_at: string;
};

type InstallmentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface NewDebtFormData {
  // Dados do Cliente
  is_new_customer: boolean;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  existing_customer_id: string;
  
  // Detalhes da Venda
  product_description: string;
  total_value: string;
  
  // Parcelamento
  installments: number;
  installment_value: string;
  frequency: InstallmentFrequency;
  
  // Datas
  first_payment_date: string;
  final_due_date: string;
  
  // Observações
  observations: string;
}

const CreditTab = () => {
  const { toast } = useToast();
  const { data, addCreditTransaction, refreshData } = useFinancial();
  const { token } = useAuth();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CreditAccount | null>(null);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<NewDebtFormData>({
    is_new_customer: true,
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    existing_customer_id: '',
    product_description: '',
    total_value: '',
    installments: 1,
    installment_value: '',
    frequency: 'monthly',
    first_payment_date: new Date().toISOString().split('T')[0],
    final_due_date: '',
    observations: ''
  });

  const accounts = data.creditAccounts;
  const filteredAccounts = accounts.filter(account => 
    account.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.customer_phone || '').includes(searchTerm)
  );

  // Calcular valor da parcela automaticamente
  useEffect(() => {
    if (formData.total_value && formData.installments > 0) {
      const total = parseFloat(formData.total_value);
      const installmentValue = total / formData.installments;
      setFormData(prev => ({
        ...prev,
        installment_value: installmentValue.toFixed(2)
      }));
    }
  }, [formData.total_value, formData.installments]);

  // Calcular data final automaticamente
  useEffect(() => {
    if (formData.first_payment_date && formData.installments > 0 && formData.frequency) {
      const firstDate = new Date(formData.first_payment_date);
      let finalDate = new Date(firstDate);
      
      switch (formData.frequency) {
        case 'daily':
          finalDate.setDate(firstDate.getDate() + (formData.installments - 1));
          break;
        case 'weekly':
          finalDate.setDate(firstDate.getDate() + (formData.installments - 1) * 7);
          break;
        case 'biweekly':
          finalDate.setDate(firstDate.getDate() + (formData.installments - 1) * 14);
          break;
        case 'monthly':
          finalDate.setMonth(firstDate.getMonth() + (formData.installments - 1));
          break;
      }
      
      setFormData(prev => ({
        ...prev,
        final_due_date: finalDate.toISOString().split('T')[0]
      }));
      
      console.log('[CreditTab] 📅 Data final calculada:', {
        frequency: formData.frequency,
        installments: formData.installments,
        firstDate: formData.first_payment_date,
        finalDate: finalDate.toISOString().split('T')[0]
      });
    }
  }, [formData.first_payment_date, formData.installments, formData.frequency]);

  // Preencher dados do cliente quando selecionado
  const handleClientSelect = (client: CreditAccount) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      is_new_customer: false,
      customer_name: client.customer_name,
      customer_phone: client.customer_phone,
      customer_address: client.customer_address || '',
      existing_customer_id: client.id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.customer_name.trim()) {
      toast({ title: 'Erro', description: 'Nome do cliente é obrigatório', variant: 'destructive' });
      return;
    }
    
    if (!formData.customer_phone.trim()) {
      toast({ title: 'Erro', description: 'Telefone do cliente é obrigatório', variant: 'destructive' });
      return;
    }
    
    if (!formData.product_description.trim()) {
      toast({ title: 'Erro', description: 'Descrição do produto/serviço é obrigatória', variant: 'destructive' });
      return;
    }
    
    if (!formData.total_value || parseFloat(formData.total_value) <= 0) {
      toast({ title: 'Erro', description: 'Valor total deve ser maior que zero', variant: 'destructive' });
      return;
    }
    
    if (formData.installments <= 0) {
      toast({ title: 'Erro', description: 'Número de parcelas deve ser maior que zero', variant: 'destructive' });
      return;
    }

    try {
      console.log('[CreditTab] 📤 ENVIANDO NOVA OPERAÇÃO DE DÉBITO:', formData);
      
      let creditAccountId = formData.existing_customer_id;
      
      // Se for cliente novo, criar primeiro
      if (formData.is_new_customer) {
        const createClientRes = await api.post('/credit-accounts', {
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_address: formData.customer_address
        });
        creditAccountId = createClientRes.data.id;
        console.log('[CreditTab] ✅ Cliente criado:', creditAccountId);
      }
      
      // Criar a operação de débito
      const debtOperation = {
        credit_account_id: creditAccountId,
        type: 'debt',
        amount: parseFloat(formData.total_value),
        description: formData.product_description,
        installments: formData.installments,
        installment_value: parseFloat(formData.installment_value),
        frequency: formData.frequency,
        first_payment_date: formData.first_payment_date,
        final_due_date: formData.final_due_date,
        observations: formData.observations
      };
      
      console.log('[CreditTab] 📤 Operação de débito:', debtOperation);
      
      const debtRes = await api.post('/credit-transactions', debtOperation);
      console.log('[CreditTab] ✅ Débito registrado:', debtRes.data);
      
      // Atualizar dados
      await refreshData();
      
      // Limpar formulário
      setFormData({
        is_new_customer: true,
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        existing_customer_id: '',
        product_description: '',
        total_value: '',
        installments: 1,
        installment_value: '',
        frequency: 'monthly',
        first_payment_date: new Date().toISOString().split('T')[0],
        final_due_date: '',
        observations: ''
      });
      
      setShowTransactionForm(false);
      setSelectedClient(null);
      
      toast({ title: 'Sucesso', description: 'Operação de débito registrada com sucesso!' });
      
    } catch (error) {
      console.error('[CreditTab] ❌ Erro ao registrar débito:', error);
      toast({ title: 'Erro', description: 'Não foi possível registrar a operação', variant: 'destructive' });
    }
  };

  const handleClientClick = (client: CreditAccount) => {
    setSelectedClient(client);
    setShowClientHistory(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Crediário', 20, 20);
    doc.text(`Total de clientes: ${accounts.length}`, 20, 40);
    doc.text(`Total em dívida: R$ ${accounts.reduce((sum, acc) => sum + acc.total_debt, 0).toFixed(2)}`, 20, 50);
    doc.save('crediario.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(accounts.map(acc => ({
      Nome: acc.customer_name,
      Telefone: acc.customer_phone,
      'Total em Dívida': acc.total_debt,
      'Data de Criação': new Date(acc.created_at).toLocaleDateString('pt-BR')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Crediário');
    XLSX.writeFile(wb, 'crediario.xlsx');
  };

  const totalDebt = data.totalDebt;
  const clientsWithDebt = accounts.filter(account => Number(account.total_debt) > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            💳 Crediário
          </h2>
          <p className="text-muted-foreground">Sistema inteligente de crédito para sua loja</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setShowTransactionForm(!showTransactionForm)} 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showTransactionForm ? 'Fechar' : 'Nova Operação'}
          </Button>
          <Button variant="outline" onClick={exportToPDF} className="border-orange-200 text-orange-600 hover:bg-orange-50">
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="border-green-200 text-green-600 hover:bg-green-50">
            <FileDown className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">💰 Dinheiro em Aberto</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totalDebt.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">⚠️ Clientes Devendo</p>
                <p className="text-2xl font-bold text-orange-600">{clientsWithDebt}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">👥 Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="🔍 Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Nova Operação */}
      {showTransactionForm && (
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
            <CardTitle className="flex items-center text-orange-700">
              <Plus className="h-5 w-5 mr-2" />
              Nova Operação do Crediário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tipo de Operação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  true ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-700">Novo Débito</h3>
                      <p className="text-sm text-red-600">Cliente ficou devendo</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all hover:border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">Pagamento</h3>
                      <p className="text-sm text-gray-600">Cliente pagou</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Dados do Cliente
                </h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_new_customer}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new_customer: checked }))}
                  />
                  <Label>Cliente novo</Label>
                </div>

                {formData.is_new_customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Nome do Cliente *</Label>
                      <Input
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Ex: Alex Sander"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">WhatsApp *</Label>
                      <Input
                        id="customer_phone"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="Ex: 51992401184"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="customer_address">Endereço</Label>
                      <Input
                        id="customer_address"
                        value={formData.customer_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                        placeholder="Ex: Rua Padre Raulino Reitz, nº 123"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Selecionar Cliente Existente</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                      {filteredAccounts.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedClient?.id === client.id
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{client.customer_name}</div>
                          <div className="text-xs text-gray-600">{client.customer_phone}</div>
                          <div className="text-xs text-red-600 font-medium">
                            Dívida: R$ {Number(client.total_debt).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detalhes da Venda */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Detalhes da Venda
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_description">Descrição do produto ou serviço *</Label>
                    <Textarea
                      id="product_description"
                      value={formData.product_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
                      placeholder="Ex: Compra de mercadoria, Conserto de TV, etc."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_value">Valor total *</Label>
                    <Input
                      id="total_value"
                      type="number"
                      step="0.01"
                      value={formData.total_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value }))}
                      placeholder="R$ 0,00"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Parcelamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Parcelamento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="installments">Parcelas (vezes que vai pagar) *</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      value={formData.installments}
                      onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) || 1 }))}
                      placeholder="Ex: 3"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="installment_value">Valor de cada parcela</Label>
                    <Input
                      id="installment_value"
                      type="number"
                      step="0.01"
                      value={formData.installment_value}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: InstallmentFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Datas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_payment_date">Data da primeira cobrança *</Label>
                    <Input
                      id="first_payment_date"
                      type="date"
                      value={formData.first_payment_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_payment_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="final_due_date">Data de vencimento final</Label>
                    <Input
                      id="final_due_date"
                      type="date"
                      value={formData.final_due_date}
                      readOnly
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Observações
                </h3>
                
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Ex: Combinado pagar toda sexta-feira, Vai pagar parcelado via Pix, Cliente pediu pra começar a pagar dia 5"
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransactionForm(false)}
                >
                  ❌ Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  💾 Salvar operação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  📨 Enviar no WhatsApp
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista Moderna de Clientes */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" />
            Meus Clientes ({filteredAccounts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2 text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Tente uma busca diferente' : 'Registre sua primeira operação para começar'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleClientClick(account)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        Number(account.total_debt) > 0 ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <Users className={`h-6 w-6 ${
                          Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{account.customer_name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {account.customer_phone && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {account.customer_phone}
                            </span>
                          )}
                          <span>Clique para ver histórico</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold mb-1 ${
                        Number(account.total_debt) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {Number(account.total_debt) > 0 
                          ? `R$ ${Number(account.total_debt).toFixed(2).replace('.', ',')}`
                          : '✅ Quitado'
                        }
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={Number(account.total_debt) > 0 ? "destructive" : "default"} 
                          className="text-xs"
                        >
                          {Number(account.total_debt) > 0 ? 'Aguardando pagamento' : 'Quitado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Histórico */}
      <ClientHistoryModal
        isOpen={showClientHistory}
        onClose={() => setShowClientHistory(false)}
        client={selectedClient}
      />
    </div>
  );
};

export default CreditTab;