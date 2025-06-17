
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  TrendingUp, 
  Settings,
  LogOut,
  Store
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type AdminView = "dashboard" | "products" | "categories" | "financial";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

const AdminSidebar = ({ currentView, onViewChange }: AdminSidebarProps) => {
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      view: "dashboard" as AdminView,
    },
    {
      title: "Produtos",
      icon: Package,
      view: "products" as AdminView,
    },
    {
      title: "Categorias",
      icon: Tag,
      view: "categories" as AdminView,
    },
    {
      title: "Financeiro",
      icon: TrendingUp,
      view: "financial" as AdminView,
    },
  ];

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/4e76fa9e-adfb-440b-a373-b991de11248f.png" 
            alt="LinkStore Logo" 
            className="h-8 w-auto"
          />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500">LinkStore</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.view)}
                    className={`w-full ${
                      currentView === item.view
                        ? "bg-purple-100 text-purple-700 border-r-2 border-purple-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 space-y-2">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to="/">
            <Store className="h-4 w-4 mr-2" />
            Ver Loja
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-gray-500">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
