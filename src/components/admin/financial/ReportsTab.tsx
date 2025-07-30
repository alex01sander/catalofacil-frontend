import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, Share2, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Removido: import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancial } from "@/contexts/FinancialContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";

type CashFlowEntry = Tables<'cash_flow'>;
type CreditAccount = Tables<'credit_accounts'>;
type Expense = Tables<'expenses'>;

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  entries: CashFlowEntry[];
  debtors: CreditAccount[];
}

const ReportsTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { data, refreshData } = useFinancial();
  const { settings } = useStoreSettings();

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return { 
          start: startDate ? new Date(startDate) : startOfMonth(now), 
          end: endDate ? new Date(endDate) : endOfMonth(now) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const generateReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await refreshData(); // Garante dados atualizados
      const { start, end } = getPeriodDates();
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      // Filtra lançamentos do fluxo de caixa pelo período
      const entries = (data.cashFlow || []).filter(entry => {
        const entryDate = entry.date ? new Date(entry.date) : null;
        return entryDate && entryDate >= start && entryDate <= end;
      });
      // Filtra despesas pagas no período
      const expensesPaid = (data.expenses || []).filter(exp => {
        const dueDate = exp.due_date ? new Date(exp.due_date) : null;
        return exp.status === 'paid' && dueDate && dueDate >= start && dueDate <= end;
      });
      // Filtra devedores
      const debtors = (data.creditAccounts || []).filter(acc => Number(acc.total_debt) > 0);
      // Calcula totais
      const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
      const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0) + expensesPaid.reduce((sum, e) => sum + Number(e.amount), 0);
      setReportData({
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        entries,
        debtors
      });
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const { start, end } = getPeriodDates();
    // Adiciona logo da loja se existir
    if (settings.mobile_logo) {
      // Baixa a imagem e converte para base64
      const imgData = await fetch(settings.mobile_logo)
        .then(r => r.blob())
        .then(blob => new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }));
      // Centraliza a logo
      doc.addImage(imgData, 'PNG', 80, 10, 50, 50, undefined, 'FAST');
    }
    // Nome da loja centralizado
    doc.setFontSize(18);
    doc.text(settings.store_name || 'Relatório Financeiro', 105, 70, { align: 'center' });
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${format(start, 'dd/MM/yyyy', { locale: ptBR })} até ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`, 105, 80, { align: 'center' });
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 85, 190, 85);
    // Métricas principais
    doc.setFontSize(14);
    doc.text('Resumo Financeiro:', 20, 100);
    doc.setFontSize(12);
    doc.text(`Dinheiro que entrou: R$ ${reportData.totalIncome.toFixed(2).replace('.', ',')}`, 20, 110);
    doc.text(`Contas pagas: R$ ${reportData.totalExpenses.toFixed(2).replace('.', ',')}`, 20, 120);
    doc.text(`Lucro estimado: R$ ${reportData.profit.toFixed(2).replace('.', ',')}`, 20, 130);
    // Últimos lançamentos
    if (reportData.entries.length > 0) {
      doc.setFontSize(14);
      doc.text('Últimos Lançamentos:', 20, 145);
      let yPos = 155;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Data', 20, yPos);
      doc.text('Tipo', 45, yPos);
      doc.text('Valor', 70, yPos);
      doc.text('Descrição', 100, yPos);
      doc.text('Categoria', 150, yPos);
      yPos += 7;
      doc.setTextColor(30);
      reportData.entries.slice(0, 10).forEach((entry) => {
        const typeText = entry.type === 'income' ? 'Entrada' : 'Saída';
        const amountText = `R$ ${Number(entry.amount).toFixed(2).replace('.', ',')}`;
        doc.text(format(new Date(entry.date), 'dd/MM'), 20, yPos);
        doc.text(typeText, 45, yPos);
        doc.text(amountText, 70, yPos);
        doc.text(entry.description || '', 100, yPos);
        doc.text(entry.category || '', 150, yPos);
        yPos += 7;
      });
    }
    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Relatório gerado automaticamente pelo Catalogofacil', 20, 285);
    doc.save(`relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    toast({
      title: "PDF Baixado",
      description: "Relatório salvo em PDF com sucesso!",
    });
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const { start, end } = getPeriodDates();
    
    // Criar planilha com resumo
    const summaryData = [
      ['Relatório Financeiro'],
      [`Período: ${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}`],
      [''],
      ['Resumo Financeiro:'],
      ['Dinheiro que entrou', reportData.totalIncome],
      ['Contas pagas', reportData.totalExpenses],
      ['Lucro estimado', reportData.profit],
      [''],
      ['Lançamentos:'],
      ['Data', 'Tipo', 'Valor', 'Descrição']
    ];

    // Adicionar lançamentos
    reportData.entries.forEach(entry => {
      summaryData.push([
        format(new Date(entry.date), 'dd/MM/yyyy'),
        entry.type === 'income' ? 'Entrada' : 'Saída',
        Number(entry.amount),
        entry.description
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    XLSX.writeFile(wb, `relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    
    toast({
      title: "Excel Baixado",
      description: "Relatório salvo em Excel com sucesso!",
    });
  };

  const shareWhatsApp = () => {
    if (!reportData) return;
    const { start, end } = getPeriodDates();
    const message =
      `*Relatório Financeiro - ${settings.store_name || ''}*\n` +
      `\n` +
      `Período: ${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}\n` +
      `\n` +
      `Dinheiro que entrou: R$ ${reportData.totalIncome.toFixed(2).replace('.', ',')}\n` +
      `Contas pagas: R$ ${reportData.totalExpenses.toFixed(2).replace('.', ',')}\n` +
      `Lucro estimado: R$ ${reportData.profit.toFixed(2).replace('.', ',')}\n` +
      `\n` +
      `_Gerado pelo Catalogofacil_`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const chartData = reportData ? [
    { name: 'Entradas', value: reportData.totalIncome, color: '#10b981' },
    { name: 'Saídas', value: reportData.totalExpenses, color: '#ef4444' }
  ] : [];

  const barChartData = reportData ? 
    (reportData.entries || []).slice(0, 7).map(entry => ({
      date: format(new Date(entry.date), 'dd/MM'),
      income: entry.type === 'income' ? Number(entry.amount) : 0,
      expense: entry.type === 'expense' ? Number(entry.amount) : 0
    })) : [];

  // Função utilitária para traduzir tipo e método de pagamento
  const traduzirTipo = (tipo: string) => {
    if (tipo === 'income') return 'Entrada';
    if (tipo === 'expense') return 'Despesa';
    return tipo;
  };
  const traduzirPagamento = (metodo: string) => {
    if (metodo === 'cash') return 'Dinheiro';
    if (metodo === 'card') return 'Cartão';
    if (metodo === 'pix') return 'Pix';
    return metodo;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h2>
        <p className="text-gray-600">Visualize e exporte seus dados financeiros</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Período</Label>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório */}
      {reportData && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dinheiro que entrou</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {reportData.totalIncome.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contas pagas</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {reportData.totalExpenses.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lucro estimado</p>
                    <p className={`text-2xl font-bold ${reportData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {reportData.profit.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entradas vs Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: R$ ${value.toFixed(2).replace('.', ',')}`}
                    >
                      {(chartData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2).replace('.', ',')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimentação por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2).replace('.', ',')}`} />
                    <Bar dataKey="income" fill="#10b981" name="Entradas" />
                    <Bar dataKey="expense" fill="#ef4444" name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lançamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(reportData.entries || []).slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {entry.type === 'income' ? 
                          <TrendingUp className="h-5 w-5 text-green-600" /> : 
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">{traduzirTipo(entry.type)}</Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'income' ? '+' : '-'} R$ {Number(entry.amount).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-sm text-gray-500">{traduzirPagamento(entry.payment_method)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clientes Devedores */}
          {(reportData.debtors || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Devedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(reportData.debtors || []).map((debtor) => (
                    <div key={debtor.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{debtor.customer_name}</p>
                        {debtor.customer_phone && (
                          <p className="text-sm text-gray-500">{debtor.customer_phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          R$ {Number(debtor.total_debt).toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-sm text-gray-500">em débito</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={exportToPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button onClick={exportToExcel} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Baixar Excel
                </Button>
                <Button onClick={shareWhatsApp} variant="outline" className="bg-green-50 hover:bg-green-100">
                  <Share2 className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsTab;