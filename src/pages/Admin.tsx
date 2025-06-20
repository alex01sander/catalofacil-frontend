
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ProductManagement from "@/components/admin/ProductManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import FinancialManagement from "@/components/admin/FinancialManagement";

type AdminView = "dashboard" | "products" | "categories" | "financial";

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
      case "financial":
        return <FinancialManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
