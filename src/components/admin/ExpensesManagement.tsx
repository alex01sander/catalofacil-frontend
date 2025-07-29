import { FinancialProvider } from "@/contexts/FinancialContext";
import ExpensesTab from "./financial/ExpensesTab";

const ExpensesManagement = () => {
  return (
    <FinancialProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600">Controle de gastos e despesas da empresa</p>
        </div>

        <ExpensesTab />
      </div>
    </FinancialProvider>
  );
};

export default ExpensesManagement;