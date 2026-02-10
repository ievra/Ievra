import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, BarChart3, Briefcase, Users, Mail, Newspaper, Edit3, Home, Image, Shield } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import { useLanguage } from "@/contexts/LanguageContext";

// Map tab IDs to required permissions
const TAB_PERMISSIONS: Record<string, string> = {
  overview: 'overview',
  projects: 'projects',
  clients: 'crm',
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

function getTabs(t: (key: string) => string) {
  return [
    { id: 'overview', label: t('admin.overview'), icon: BarChart3 },
    { id: 'projects', label: t('admin.projects'), icon: Briefcase },
    { id: 'clients', label: t('admin.crm'), icon: Users },
    { id: 'inquiries', label: t('admin.inquiries'), icon: Mail },
    { id: 'articles', label: t('admin.articles'), icon: Newspaper },
    { id: 'homepage', label: t('admin.homepage'), icon: Home },
    { id: 'about', label: t('admin.about'), icon: Image },
    { id: 'content', label: t('admin.seo'), icon: Edit3 },
    { id: 'users', label: t('admin.users'), icon: Shield }
  ];
}

export default function Admin() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const allTabs = getTabs(t);
  
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
      <div className="min-h-screen bg-black">
        <div className="max-w-[1600px] mx-auto py-24 px-6 md:px-10 lg:px-16">
          {/* Header Section with Glass Morphism */}
          <div className="mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/2 backdrop-blur-xl rounded-none"></div>
              <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-none p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center">
                        <Home className="w-5 h-5 text-white" />
                      </div>
                      <h1 className="text-4xl font-light text-white tracking-wider" data-testid="heading-admin">
                        {t('admin.dashboard').toUpperCase()}
                      </h1>
                    </div>
                    <p className="text-gray-400 font-light tracking-wide">
                      {t('admin.manage')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-none backdrop-blur-sm">
                      <User className="h-4 w-4 text-white/70" />
                      <span className="text-sm text-white font-light" data-testid="text-current-user">
                        {user?.username || 'Admin'}
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
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs with Modern Design */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-white/1 backdrop-blur-xl rounded-none"></div>
              <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-none p-6">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-light tracking-wide transition-all duration-300 ease-in-out rounded-none ${
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
            <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-none overflow-hidden">
              <AdminDashboard activeTab={activeTab} user={user} hasPermission={hasPermission} />
            </div>
          </div>
        </div>
      </div>
  );
}
