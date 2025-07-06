import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, Share2, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      const { start, end } = getPeriodDates();
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // Buscar entradas de caixa
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (cashFlowError) throw cashFlowError;

      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', startDateStr)
        .lte('due_date', endDateStr)
        .eq('status', 'paid');

      if (expensesError) throw expensesError;

      // Buscar clientes devedores
      const { data: debtorsData, error: debtorsError } = await supabase
        .from('credit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .gt('total_debt', 0);

      if (debtorsError) throw debtorsError;

      const totalIncome = (cashFlowData || [])
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);

      const totalExpenses = (cashFlowData || [])
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + Number(entry.amount), 0) +
        (expensesData || [])
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      setReportData({
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        entries: cashFlowData || [],
        debtors: debtorsData || []
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

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const { start, end } = getPeriodDates();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 20, 30);
    doc.setFontSize(12);
    doc.text(`Período: ${format(start, 'dd/MM/yyyy', { locale: ptBR })} até ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`, 20, 45);
    
    // Métricas principais
    doc.setFontSize(14);
    doc.text('Resumo Financeiro:', 20, 65);
    doc.setFontSize(12);
    doc.text(`Dinheiro que entrou: R$ ${reportData.totalIncome.toFixed(2).replace('.', ',')}`, 20, 80);
    doc.text(`Contas pagas: R$ ${reportData.totalExpenses.toFixed(2).replace('.', ',')}`, 20, 95);
    doc.text(`Lucro estimado: R$ ${reportData.profit.toFixed(2).replace('.', ',')}`, 20, 110);
    
    // Lançamentos
    if (reportData.entries.length > 0) {
      doc.setFontSize(14);
      doc.text('Últimos Lançamentos:', 20, 135);
      let yPos = 150;
      
      reportData.entries.slice(0, 10).forEach((entry) => {
        doc.setFontSize(10);
        const typeText = entry.type === 'income' ? 'Entrada' : 'Saída';
        const amountText = `R$ ${Number(entry.amount).toFixed(2).replace('.', ',')}`;
        doc.text(`${format(new Date(entry.date), 'dd/MM')} - ${typeText} - ${amountText} - ${entry.description}`, 20, yPos);
        yPos += 15;
      });
    }
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Relatório gerado automaticamente pelo Catalogofacil', 20, 280);
    
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
    const message = `📊 *Relatório Financeiro*\n\n` +
      `📅 Período: ${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}\n\n` +
      `💰 Dinheiro que entrou: R$ ${reportData.totalIncome.toFixed(2).replace('.', ',')}\n` +
      `💸 Contas pagas: R$ ${reportData.totalExpenses.toFixed(2).replace('.', ',')}\n` +
      `📈 Lucro estimado: R$ ${reportData.profit.toFixed(2).replace('.', ',')}\n\n` +
      `📱 Gerado pelo Catalogofacil`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const chartData = reportData ? [
    { name: 'Entradas', value: reportData.totalIncome, color: '#10b981' },
    { name: 'Saídas', value: reportData.totalExpenses, color: '#ef4444' }
  ] : [];

  const barChartData = reportData ? 
    reportData.entries.slice(0, 7).map(entry => ({
      date: format(new Date(entry.date), 'dd/MM'),
      income: entry.type === 'income' ? Number(entry.amount) : 0,
      expense: entry.type === 'expense' ? Number(entry.amount) : 0
    })) : [];

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
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: R$ ${value.toFixed(2).replace('.', ',')}`}
                    >
                      {chartData.map((entry, index) => (
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
                {reportData.entries.slice(0, 10).map((entry) => (
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
                          <Badge variant="secondary" className="text-xs">
                            {entry.category}
                          </Badge>
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
                      <p className="text-sm text-gray-500">{entry.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clientes Devedores */}
          {reportData.debtors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Devedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.debtors.map((debtor) => (
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