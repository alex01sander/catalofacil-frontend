import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, DollarSign, Users, Receipt, FileText } from "lucide-react";
import CashFlowTab from "./financial/CashFlowTab";
import CreditTab from "./financial/CreditTab";
import ExpensesTab from "./financial/ExpensesTab";
import ReportsTab from "./financial/ReportsTab";

const FinancialManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-600">Controle completo das suas finanças</p>
      </div>

      <Tabs defaultValue="cash-flow" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Caixa
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Crediário
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
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
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialManagement;
