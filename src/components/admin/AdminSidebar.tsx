import { LayoutDashboard, Package, Tag, TrendingUp, Settings, LogOut, Store, Menu, X } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
type AdminView = "dashboard" | "products" | "categories" | "financial" | "settings";
interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}
const AdminSidebar = ({
  currentView,
  onViewChange
}: AdminSidebarProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const menuItems = [{
    title: "Dashboard",
    icon: LayoutDashboard,
    view: "dashboard" as AdminView
  }, {
    title: "Produtos",
    icon: Package,
    view: "products" as AdminView
  }, {
    title: "Categorias",
    icon: Tag,
    view: "categories" as AdminView
  }, {
    title: "Financeiro",
    icon: TrendingUp,
    view: "financial" as AdminView
  }, {
    title: "Configurações",
    icon: Settings,
    view: "settings" as AdminView
  }];
  const handleViewChange = (view: AdminView) => {
    onViewChange(view);
    setIsSheetOpen(false);
  };
  const SidebarContentComponent = () => <>
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">LinkStore</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map(item => <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton onClick={() => handleViewChange(item.view)} className={`w-full h-12 rounded-xl transition-all duration-200 ${currentView === item.view ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-gray-100 space-y-3">
        <Button variant="outline" size="sm" asChild className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50">
          <Link to="/">
            <Store className="h-4 w-4 mr-2" />
            Ver Loja
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full h-11 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </>;
  return <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.map(item => <button key={item.view} onClick={() => onViewChange(item.view)} className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 ${currentView === item.view ? "bg-gradient-to-t from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <item.icon className={`h-5 w-5 mb-1 ${currentView === item.view ? 'animate-pulse' : ''}`} />
              
              {currentView === item.view && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
            </button>)}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex border-r border-gray-100 bg-white">
        <SidebarContentComponent />
      </Sidebar>
    </>;
};
export default AdminSidebar;