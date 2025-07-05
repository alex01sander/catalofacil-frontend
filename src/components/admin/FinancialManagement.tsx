import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, DollarSign, Users, Receipt, Calculator, FileText } from "lucide-react";
import CashFlowTab from "./financial/CashFlowTab";
import CreditTab from "./financial/CreditTab";
import ExpensesTab from "./financial/ExpensesTab";

const FinancialManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-600">Controle completo das suas finanças</p>
      </div>

      <Tabs defaultValue="cash-flow" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Caixa
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fiado
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Preços
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash-flow">
          <CashFlowTab />
        </TabsContent>

        <TabsContent value="credit">
          <CreditTab />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>

        <TabsContent value="reports">
          <div className="text-center py-20">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Relatórios em desenvolvimento</p>
            <p className="text-sm text-gray-500">Em breve você poderá ver relatórios detalhados</p>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="text-center py-20">
            <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Simulador de preços em desenvolvimento</p>
            <p className="text-sm text-gray-500">Em breve você poderá simular preços ideais</p>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Exportação em desenvolvimento</p>
            <p className="text-sm text-gray-500">Em breve você poderá exportar relatórios em PDF e Excel</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialManagement;
