import { useLocation, useNavigate } from 'react-router-dom';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import RadioTower from 'lucide-react/dist/esm/icons/radio-tower';
import Users from 'lucide-react/dist/esm/icons/users';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Leaf from 'lucide-react/dist/esm/icons/leaf';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import PawPrint from 'lucide-react/dist/esm/icons/paw-print';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import Satellite from 'lucide-react/dist/esm/icons/satellite';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import { useTheme } from 'next-themes';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
];

const REFERENCE_ITEMS = [
  { label: 'Species', href: '/species', icon: Leaf },
  { label: 'Study Areas', href: '/study-areas', icon: MapPin },
  { label: 'Collar Models', href: '/collar-models', icon: RadioTower },
  { label: 'Personnel', href: '/personnel', icon: Users },
];

const FIELD_ITEMS = [
  { label: 'Animals', href: '/animals', icon: PawPrint },
  { label: 'Collar Deployments', href: '/collar-deployments', icon: Satellite },
  { label: 'Captures', href: '/captures', icon: ClipboardList },
  { label: 'Telemetry', href: '/telemetry', icon: Navigation },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <PawPrint size={18} className="text-muted-foreground" />
          <span className="font-bold text-foreground">Wildlife Tracker</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reference Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {REFERENCE_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Field Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {FIELD_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 space-y-2">
        {user?.email && (
          <p className="text-xs text-muted-foreground truncate" title={user.email}>
            {user.email}
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun /> : <Moon />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void signOut()}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
