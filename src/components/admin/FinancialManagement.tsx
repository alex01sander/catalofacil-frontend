import { FinancialProvider } from "@/contexts/FinancialContext";
import CashFlowTab from "./financial/CashFlowTab";

const FinancialManagement = () => {
  return (
    <FinancialProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caixa</h1>
          <p className="text-gray-600">Controle completo do seu fluxo de caixa</p>
        </div>

        <CashFlowTab />
      </div>
    </FinancialProvider>
  );
};

export default FinancialManagement;
