import { LayoutDashboard, Package, Tag, TrendingUp, Settings, LogOut, Store, Menu } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
type AdminView = "dashboard" | "products" | "categories" | "financial";
interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}
const AdminSidebar = ({
  currentView,
  onViewChange
}: AdminSidebarProps) => {
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
  }];
  const SidebarContentComponent = () => <>
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-2">
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
              {menuItems.map(item => <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton onClick={() => onViewChange(item.view)} className={`w-full ${currentView === item.view ? "bg-purple-100 text-purple-700 border-r-2 border-purple-600" : "text-gray-600 hover:bg-gray-100"}`}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
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
    </>;
  return <>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header with Menu */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div>
            
            
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex h-full w-full flex-col bg-white">
                <SidebarContentComponent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex justify-around">
            {menuItems.map(item => <button key={item.view} onClick={() => onViewChange(item.view)} className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${currentView === item.view ? "text-purple-600 bg-purple-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.title}</span>
              </button>)}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex border-r border-gray-200">
        <SidebarContentComponent />
      </Sidebar>
    </>;
};
export default AdminSidebar;