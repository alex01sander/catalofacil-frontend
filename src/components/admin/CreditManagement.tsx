import { FinancialProvider } from "@/contexts/FinancialContext";
import CreditTab from "./financial/CreditTab";

const CreditManagement = () => {
  return (
    <FinancialProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crediário</h1>
          <p className="text-gray-600">Controle de vendas a prazo e contas a receber</p>
        </div>

        <CreditTab />
      </div>
    </FinancialProvider>
  );
};

export default CreditManagement;