import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, BarChart3, Briefcase, Users, Mail, Newspaper, Edit3, Home, Image, Shield, Search, Handshake } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import { useLanguage } from "@/contexts/LanguageContext";

// Map tab IDs to required permissions
const TAB_PERMISSIONS: Record<string, string> = {
  overview: 'overview',
  projects: 'projects',
  clients: 'crm',
  'business-partners': 'crm',
  lookup: 'lookup',
  inquiries: 'inquiries',
  articles: 'articles',
  homepage: 'homepage',
  about: 'about',
  content: 'content',
  users: 'users'
};

// Helper function to check if user has permission for a specific feature
function hasPermission(user: any, permission: string): boolean {
  if (!user) return false;
  
  // Overview tab is always accessible to all logged-in users
  if (permission === 'overview') {
    return true;
  }
  
  // Only super admin can access Users tab
  if (permission === 'users') {
    return user.role === 'superadmin';
  }
  
  // Super Admin role always has full access to everything
  if (user.role === 'superadmin') return true;
  
  // Admin and Editor roles: check if user has the specific permission in their permissions array
  // This enables granular permission control for admin users
  return user.permissions && Array.isArray(user.permissions) && user.permissions.includes(permission);
}

function getTabs(t: (key: string) => string, language: string) {
  return [
    { id: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { id: 'inquiries', label: t('admin.inquiries'), icon: Mail },
    { id: 'clients', label: t('admin.crm'), icon: Users },
    { id: 'business-partners', label: language === 'vi' ? 'Đối Tác' : 'Partners', icon: Handshake },
    { id: 'lookup', label: language === 'vi' ? 'Tra Cứu' : 'Lookup', icon: Search },
    { id: 'projects', label: t('admin.projects'), icon: Briefcase },
    { id: 'articles', label: t('admin.articles'), icon: Newspaper },
    { id: 'homepage', label: t('admin.homepage'), icon: Home },
    { id: 'about', label: t('admin.about'), icon: Image },
    { id: 'content', label: t('admin.seo'), icon: Edit3 },
    { id: 'users', label: t('admin.users'), icon: Shield }
  ];
}

export default function Admin() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const allTabs = getTabs(t, language);
  
  // Filter tabs based on user permissions
  const tabs = allTabs.filter(tab => {
    const permission = TAB_PERMISSIONS[tab.id];
    return hasPermission(user, permission);
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã được đăng xuất khỏi hệ thống.",
    });
    // Redirect to home page after logout
    navigate('/');
  };

  return (
      <div className="min-h-screen pb-32 bg-black">
        <div className="max-w-[1600px] mx-auto py-24 px-6 md:px-10 lg:px-16">
          {/* Admin & Logout */}
          <div className="mb-8 flex items-center justify-end gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-none backdrop-blur-sm">
              <User className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white font-light" data-testid="text-current-user">
                {user?.displayName || user?.username || 'Admin'}
              </span>
            </div>
            <Button 
              onClick={handleLogout}
              className="bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/10 px-4 py-2 font-light tracking-wide transition-all duration-300 ease-in-out rounded-none"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('admin.logout')}
            </Button>
          </div>

          {/* Navigation Tabs with Modern Design */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/1 backdrop-blur-xl rounded-none"></div>
              <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-none p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full justify-start px-4 py-3 font-light tracking-wide transition-all duration-300 ease-in-out rounded-none ${
                          isActive 
                            ? 'bg-white/20 border border-white/30 text-white backdrop-blur-sm' 
                            : 'bg-transparent border border-white/30 text-white/70 hover:bg-white/10 hover:text-white hover:border-white'
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content with Glass Effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-white/1 backdrop-blur-xl rounded-none"></div>
            <div className="relative bg-black/30 backdrop-blur-md border-0 rounded-none overflow-x-auto">
              <AdminDashboard activeTab={activeTab} user={user} hasPermission={hasPermission} />
            </div>
          </div>
        </div>
      </div>
  );
}
