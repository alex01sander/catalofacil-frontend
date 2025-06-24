
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import ControllerSidebar from "@/components/controller/ControllerSidebar";
import DomainManagement from "@/components/controller/DomainManagement";
import UserManagement from "@/components/controller/UserManagement";

type ControllerView = "domains" | "users";

const Controller = () => {
  const [currentView, setCurrentView] = useState<ControllerView>("domains");

  const renderContent = () => {
    switch (currentView) {
      case "domains":
        return <DomainManagement />;
      case "users":
        return <UserManagement />;
      default:
        return <DomainManagement />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <ControllerSidebar currentView={currentView} onViewChange={setCurrentView} />
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

export default Controller;
