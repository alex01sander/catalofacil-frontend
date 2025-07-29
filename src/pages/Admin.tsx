
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ProductManagement from "@/components/admin/ProductManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import FinancialManagement from "@/components/admin/FinancialManagement";
import CreditManagement from "@/components/admin/CreditManagement";
import ExpensesManagement from "@/components/admin/ExpensesManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import StoreSettings from "@/components/admin/StoreSettings";

type AdminView = "dashboard" | "products" | "categories" | "orders" | "financial" | "financial-cash" | "financial-credit" | "financial-expenses" | "financial-reports" | "settings";

const Admin = () => {
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <AdminDashboard />;
      case "products":
        return <ProductManagement />;
      case "categories":
        return <CategoryManagement />;
      case "orders":
        return <OrderManagement />;
      case "financial":
      case "financial-cash":
        return <FinancialManagement />;
      case "financial-credit":
        return <CreditManagement />;
      case "financial-expenses":
        return <ExpensesManagement />;
      case "financial-reports":
        return <ReportsManagement />;
      case "settings":
        return <StoreSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto">
          <div className="lg:p-6 p-4 pb-24 lg:pb-6 min-h-full">
            <div className="max-w-full">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
