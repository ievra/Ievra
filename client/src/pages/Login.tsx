import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/Layout';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: language === 'vi' ? "Lỗi" : "Error",
        description: language === 'vi' ? "Vui lòng nhập đầy đủ thông tin đăng nhập." : "Please enter all login information.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast({
          title: language === 'vi' ? "Đăng nhập thành công" : "Login Successful",
          description: language === 'vi' ? "Chào mừng bạn trở lại!" : "Welcome back!",
        });
        // Add a small delay to ensure auth context is updated
        setTimeout(() => {
          navigate('/admin');
        }, 100);
      } else {
        toast({
          title: language === 'vi' ? "Đăng nhập thất bại" : "Login Failed",
          description: language === 'vi' ? "Tên đăng nhập hoặc mật khẩu không đúng." : "Incorrect username or password.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: language === 'vi' ? "Lỗi" : "Error",
        description: language === 'vi' ? "Có lỗi xảy ra. Vui lòng thử lại sau." : "An error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black flex items-center justify-center py-24">
        <div className="w-full max-w-md p-6">
          {/* Glass morphism card with subtle backdrop */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-none"></div>
            <div className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-none shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="px-8 pt-10 pb-6 text-center">
                {/* Logo */}
                <div className="mx-auto mb-6">
                  <img 
                    src="/api/assets/Brand_Mark_Logo_1770767374146.png" 
                    alt="IEVRA Design & Build" 
                    className="h-20 w-auto mx-auto opacity-90"
                  />
                </div>
                
              </div>
              
              {/* Form Section */}
              <div className="px-8 pb-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white font-light" data-testid="label-username">
                      {language === 'vi' ? 'Tên đăng nhập' : 'Username'}
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập tên đăng nhập' : 'Enter username'}
                      disabled={isLoading}
                      autoComplete="username"
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                      data-testid="input-username"
                    />
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-light" data-testid="label-password">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                        disabled={isLoading}
                        autoComplete="current-password"
                        className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-4 pr-10 text-white placeholder-gray-400 focus:border-white focus-visible:ring-0"
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword 
                          ? (language === 'vi' ? 'Ẩn mật khẩu' : 'Hide password')
                          : (language === 'vi' ? 'Hiện mật khẩu' : 'Show password')
                        }
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/10 py-3 font-light tracking-widest uppercase transition-all duration-300 ease-in-out rounded-none"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading 
                        ? (language === 'vi' ? "ĐANG ĐĂNG NHẬP..." : "LOGGING IN...") 
                        : (language === 'vi' ? "ĐĂNG NHẬP" : "LOGIN")
                      }
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}