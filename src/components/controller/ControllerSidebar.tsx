
import { Settings, Users, Globe } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface ControllerSidebarProps {
  currentView: string;
  onViewChange: (view: "domains" | "users") => void;
}

const ControllerSidebar = ({ currentView, onViewChange }: ControllerSidebarProps) => {
  const menuItems = [
    {
      title: "Gerenciar Domínios",
      icon: Globe,
      value: "domains" as const,
    },
    {
      title: "Usuários Ativos",
      icon: Users,
      value: "users" as const,
    },
  ];

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Painel de Controle</h2>
          <SidebarTrigger className="lg:hidden" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.value)}
                    isActive={currentView === item.value}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ControllerSidebar;
