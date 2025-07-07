import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, DollarSign, Search, FileDown, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFinancial } from "@/contexts/FinancialContext";
import { Tables } from "@/integrations/supabase/types";
import ClientHistoryModal from "./ClientHistoryModal";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

type CreditAccount = Tables<'credit_accounts'>;

const CreditTab = () => {
  const { toast } = useToast();
  const { data, addCreditTransaction } = useFinancial();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CreditAccount | null>(null);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    is_new_customer: true,
    customer_name: '',
    customer_phone: '',
    existing_customer_id: '',
    type: 'debt' as 'debt' | 'payment',
    amount: '',
    description: '',
    payment_method: 'pix' as 'pix' | 'cash' | 'card',
  });

  const accounts = data.creditAccounts;
  const filteredAccounts = accounts.filter(account => 
    account.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.customer_phone || '').includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(formData.amount);
      
      if (formData.is_new_customer) {
        // Criar nova conta usando o contexto
        await addCreditTransaction('', formData.type, amount, formData.description);
      } else {
        // Usar conta existente
        await addCreditTransaction(formData.existing_customer_id, formData.type, amount, formData.description);
      }
      
      setShowTransactionForm(false);
      setFormData({
        is_new_customer: true,
        customer_name: '',
        customer_phone: '',
        existing_customer_id: '',
        type: 'debt',
        amount: '',
        description: '',
        payment_method: 'pix',
      });
      
    } catch (error) {
      console.error('Erro ao processar operação:', error);
    }
  };

  const handleClientClick = (client: CreditAccount) => {
    setSelectedClient(client);
    setShowClientHistory(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório do Crediário', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
    
    let yPosition = 65;
    
    filteredAccounts.forEach((account, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.text(`${index + 1}. ${account.customer_name}`, 20, yPosition);
      doc.text(`Telefone: ${account.customer_phone || 'N/A'}`, 30, yPosition + 10);
      doc.text(`Saldo: R$ ${Number(account.total_debt).toFixed(2)}`, 30, yPosition + 20);
      
      yPosition += 35;
    });
    
    doc.save('crediario-relatorio.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = filteredAccounts.map(account => ({
      'Cliente': account.customer_name,
      'Telefone': account.customer_phone || '',
      'Saldo Devedor': Number(account.total_debt).toFixed(2),
      'Status': Number(account.total_debt) > 0 ? 'Em débito' : 'Quitado',
      'Data Cadastro': new Date(account.created_at).toLocaleDateString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Crediário');
    
    XLSX.writeFile(workbook, 'crediario-relatorio.xlsx');
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

      {/* Formulário Moderno */}
      {showTransactionForm && (
        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-orange-600" />
              </div>
              Nova Operação do Crediário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Operação com Cards */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Tipo de Operação</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${formData.type === 'debt' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-muted hover:border-red-300'
                    }`}
                    onClick={() => setFormData({...formData, type: 'debt'})}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">📝</div>
                      <h3 className="font-medium">Novo Débito</h3>
                      <p className="text-sm text-muted-foreground">Cliente ficou devendo</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${formData.type === 'payment' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-muted hover:border-green-300'
                    }`}
                    onClick={() => setFormData({...formData, type: 'payment'})}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">💰</div>
                      <h3 className="font-medium">Pagamento</h3>
                      <p className="text-sm text-muted-foreground">Cliente pagou</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    id="customer-type"
                    checked={formData.is_new_customer}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, is_new_customer: checked})
                    }
                  />
                  <Label htmlFor="customer-type" className="font-medium">
                    {formData.is_new_customer ? "👤 Cliente novo" : "📋 Cliente existente"}
                  </Label>
                </div>

                {formData.is_new_customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Nome do Cliente</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        placeholder="Digite o nome completo"
                        className="h-11"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_phone">WhatsApp</Label>
                      <Input
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                        placeholder="(11) 99999-9999"
                        className="h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="existing_customer">Selecionar Cliente</Label>
                    <Select 
                      value={formData.existing_customer_id} 
                      onValueChange={(value) => 
                        setFormData({...formData, existing_customer_id: value})
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Escolha o cliente da lista" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.customer_name}</span>
                              <Badge variant={Number(account.total_debt) > 0 ? "destructive" : "default"} className="ml-2">
                                {Number(account.total_debt) > 0 
                                  ? `Deve: R$ ${Number(account.total_debt).toFixed(2).replace('.', ',')}`
                                  : 'Em dia'
                                }
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">💵 Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0,00"
                    className="h-11 text-lg"
                    required
                  />
                </div>

                {formData.type === 'payment' && (
                  <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value: 'pix' | 'cash' | 'card') => 
                        setFormData({...formData, payment_method: value})
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">🔵 PIX</SelectItem>
                        <SelectItem value="cash">💵 Dinheiro</SelectItem>
                        <SelectItem value="card">💳 Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">📝 Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Compra de produtos, Parcela do mês..."
                  className="h-11"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-base bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {formData.type === 'debt' ? '📝 Registrar Débito' : '💰 Confirmar Pagamento'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTransactionForm(false)}
                  className="px-8 h-12"
                >
                  Cancelar
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
                          {Number(account.total_debt) > 0 ? '⚠️ Em débito' : '✅ Em dia'}
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