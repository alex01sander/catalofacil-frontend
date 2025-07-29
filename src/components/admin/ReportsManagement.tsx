import { FinancialProvider } from "@/contexts/FinancialContext";
import ReportsTab from "./financial/ReportsTab";

const ReportsManagement = () => {
  return (
    <FinancialProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Relatórios e análises financeiras</p>
        </div>

        <ReportsTab />
      </div>
    </FinancialProvider>
  );
};

export default ReportsManagement;