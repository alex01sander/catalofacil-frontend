import { LayoutDashboard, Package, Tag, TrendingUp, Settings, LogOut, Store, Menu, X, ShoppingBag, DollarSign, Users, FileText, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type AdminView = "dashboard" | "products" | "categories" | "orders" | "customers" | "financial" | "financial-cash" | "financial-credit" | "financial-expenses" | "financial-reports" | "settings";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

const AdminSidebar = ({
  currentView,
  onViewChange
}: AdminSidebarProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false);
  const { user, signOut } = useAuth();

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
    title: "Pedidos",
    icon: ShoppingBag,
    view: "orders" as AdminView
  }, {
    title: "Clientes",
    icon: Users,
    view: "customers" as AdminView
  }, {
    title: "Configurações",
    icon: Settings,
    view: "settings" as AdminView
  }];

  const financialSubItems = [
    {
      title: "Caixa",
      icon: DollarSign,
      view: "financial-cash" as AdminView
    },
    {
      title: "Crediário",
      icon: Users,
      view: "financial-credit" as AdminView
    },
    {
      title: "Despesas",
      icon: FileText,
      view: "financial-expenses" as AdminView
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      view: "financial-reports" as AdminView
    }
  ];

  const handleViewChange = (view: AdminView) => {
    onViewChange(view);
    setIsSheetOpen(false);
  };

  const handleFinancialToggle = () => {
    setIsFinancialExpanded(!isFinancialExpanded);
    if (!isFinancialExpanded) {
      // Se está expandindo, vai para o primeiro sub-item (Caixa)
      onViewChange("financial-cash");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Desconectado com sucesso!");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  const isFinancialActive = currentView.startsWith('financial');

  const SidebarContentComponent = () => <>
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2980B9] to-[#2980B9] rounded-xl flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.slice(0, 5).map(item => <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton onClick={() => handleViewChange(item.view)} className={`w-full h-12 rounded-xl transition-all duration-200 ${currentView === item.view ? "bg-gradient-to-r from-[#2980B9] to-[#2980B9] text-white shadow-lg shadow-[#2980B9]/25" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}

              {/* Menu Financeiro Expansível */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleFinancialToggle} 
                  className={`w-full h-12 rounded-xl transition-all duration-200 ${isFinancialActive ? "bg-gradient-to-r from-[#2980B9] to-[#2980B9] text-white shadow-lg shadow-[#2980B9]/25" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Financeiro</span>
                  {isFinancialExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </SidebarMenuButton>
                
                {/* Sub-itens do Financeiro */}
                {isFinancialExpanded && (
                  <div className="mt-2 ml-4 space-y-1">
                    {financialSubItems.map(subItem => (
                      <SidebarMenuButton
                        key={subItem.view}
                        onClick={() => handleViewChange(subItem.view)}
                        className={`w-full h-10 rounded-lg transition-all duration-200 text-sm ${
                          currentView === subItem.view 
                            ? "bg-blue-100 text-blue-700 border border-blue-200" 
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span className="font-medium">{subItem.title}</span>
                      </SidebarMenuButton>
                    ))}
                  </div>
                )}
              </SidebarMenuItem>

              {/* Configurações */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleViewChange("settings")} className={`w-full h-12 rounded-xl transition-all duration-200 ${currentView === "settings" ? "bg-gradient-to-r from-[#2980B9] to-[#2980B9] text-white shadow-lg shadow-[#2980B9]/25" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Configurações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full h-11 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </>;
  return <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.slice(0, 5).map(item => <button key={item.view} onClick={() => onViewChange(item.view)} className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 ${currentView === item.view ? "bg-gradient-to-t from-[#2980B9] to-[#2980B9] text-white shadow-lg shadow-[#2980B9]/25 transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <item.icon className={`h-5 w-5 mb-1 ${currentView === item.view ? 'animate-pulse' : ''}`} />
              
              {currentView === item.view && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
            </button>)}
          
          {/* Botão Financeiro Mobile */}
          <button 
            onClick={() => {
              if (isFinancialActive) {
                setIsFinancialExpanded(!isFinancialExpanded);
              } else {
                setIsFinancialExpanded(true);
                onViewChange("financial-cash");
              }
            }} 
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 ${isFinancialActive ? "bg-gradient-to-t from-[#2980B9] to-[#2980B9] text-white shadow-lg shadow-[#2980B9]/25 transform scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <TrendingUp className={`h-5 w-5 mb-1 ${isFinancialActive ? 'animate-pulse' : ''}`} />
            {isFinancialActive && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
          </button>
        </div>
        
        {/* Sub-menu Financeiro Mobile */}
        {isFinancialExpanded && (
          <div className="mt-2 px-2">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="grid grid-cols-2 gap-2">
                {financialSubItems.map(subItem => (
                  <button
                    key={subItem.view}
                    onClick={() => onViewChange(subItem.view)}
                    className={`flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 text-xs font-medium ${
                      currentView === subItem.view 
                        ? "bg-blue-100 text-blue-700 border border-blue-200" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <subItem.icon className="h-4 w-4 mr-1" />
                    {subItem.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex border-r border-gray-100 bg-white">
        <SidebarContentComponent />
      </Sidebar>
    </>;
};

export default AdminSidebar;
