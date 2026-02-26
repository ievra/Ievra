import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Plus, Lock, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(["superadmin", "admin", "editor"]).default("admin"),
  permissions: z.array(z.string()).default([]),
});

type UserFormData = z.infer<typeof userSchema>;

const AVAILABLE_PERMISSIONS = [
  { id: 'projects', label: 'Projects', labelVi: 'Dự Án' },
  { id: 'clients', label: 'Clients', labelVi: 'Khách Hàng' },
  { id: 'inquiries', label: 'Inquiries', labelVi: 'Yêu Cầu' },
  { id: 'articles', label: 'Articles', labelVi: 'Bài Viết' },
  { id: 'homepage', label: 'Homepage', labelVi: 'Trang Chủ' },
  { id: 'about', label: 'About', labelVi: 'Giới Thiệu' },
  { id: 'content', label: 'SEO', labelVi: 'SEO' },
  { id: 'lookup', label: 'Lookup', labelVi: 'Tra Cứu' },
];

function PermissionDenied({ feature }: { feature: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center h-96">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-light text-white mb-2">{t('admin.permissionDenied') || 'Quyền Hạn Không Đủ'}</h3>
            <p className="text-muted-foreground">
              {t('admin.permissionDeniedMessage') || `Bạn không có quyền truy cập tính năng ${feature}. Vui lòng liên hệ quản trị viên để được cấp quyền.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminUsersTabProps {
  user: any;
  hasPermission: (user: any, permission: string) => boolean;
}

export default function AdminUsersTab({ user, hasPermission }: AdminUsersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: adminUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      email: "",
      role: "admin",
      permissions: [],
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã tạo người dùng thành công" });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: UserFormData & { id: string }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã cập nhật người dùng thành công" });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Đã xóa người dùng thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa người dùng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, currentPassword, newPassword }: { id: string; currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('POST', `/api/users/${id}/change-password`, { currentPassword, newPassword });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Đã đổi mật khẩu thành công" });
      setIsChangePasswordDialogOpen(false);
      setChangePasswordUserId(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi đổi mật khẩu",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hasPermission(user, 'users')) {
    return <PermissionDenied feature="User Management" />;
  }

  const onUserSubmit = (data: UserFormData) => {
    if (editingUser) {
      if (user.role !== 'superadmin') {
        updateUserMutation.mutate({ 
          id: editingUser.id, 
          username: editingUser.username,
          role: editingUser.role,
          permissions: editingUser.permissions,
          displayName: data.displayName,
          email: data.email,
        });
      } else {
        updateUserMutation.mutate({ id: editingUser.id, ...data });
      }
    } else {
      if (!data.username || data.username.length < 3) {
        toast({
          title: "Validation Error",
          description: "Username is required and must be at least 3 characters",
          variant: "destructive",
        });
        return;
      }
      if (!data.password || data.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password is required and must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(data);
    }
  };

  const handleEditUser = (userToEdit: any) => {
    setEditingUser(userToEdit);
    userForm.reset({
      username: userToEdit.username,
      password: "",
      displayName: userToEdit.displayName || "",
      email: userToEdit.email || "",
      role: userToEdit.role || "admin",
      permissions: Array.isArray(userToEdit.permissions) ? userToEdit.permissions : [],
    });
    setIsUserDialogOpen(true);
  };

  const handleChangePassword = (userId: string) => {
    setChangePasswordUserId(userId);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangePasswordDialogOpen(true);
  };

  const submitPasswordChange = () => {
    if (!changePasswordUserId) return;
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirm password must be the same.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      id: changePasswordUserId,
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-sans font-light min-h-[36px]">{language === 'vi' ? 'Quản Lý Người Dùng' : 'User Management'}</h2>
          <p className="text-sm text-white/50 mt-1">
            {language === 'vi' ? 'Quản lý tài khoản admin và quyền hạn' : 'Manage admin accounts and permissions'}
          </p>
        </div>
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingUser(null);
                userForm.reset({
                  username: "",
                  password: "",
                  displayName: "",
                  email: "",
                  role: "admin",
                  permissions: [],
                });
              }}
              data-testid="button-add-user"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'vi' ? 'Thêm Người Dùng' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? (language === 'vi' ? 'Chỉnh Sửa Người Dùng' : 'Edit User') : (language === 'vi' ? 'Thêm Người Dùng Mới' : 'Add New User')}
              </DialogTitle>
            </DialogHeader>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                {user.role === 'superadmin' && (
                  <>
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'vi' ? 'Tên Đăng Nhập' : 'Username'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={language === 'vi' ? 'Nhập tên đăng nhập' : 'Enter username'} data-testid="input-user-username" disabled={!!editingUser} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!editingUser && (
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'vi' ? 'Mật Khẩu' : 'Password'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'} data-testid="input-user-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                <FormField
                  control={userForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'vi' ? 'Tên Hiển Thị' : 'Display Name'}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={language === 'vi' ? 'Nhập tên hiển thị' : 'Enter display name'} data-testid="input-user-displayname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {user.role === 'superadmin' && (
                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Vai Trò' : 'Role'}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user-role">
                              <SelectValue placeholder={language === 'vi' ? 'Chọn vai trò' : 'Select role'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="superadmin">{language === 'vi' ? 'Super Admin (Toàn Quyền)' : 'Super Admin (Full Access)'}</SelectItem>
                            <SelectItem value="admin">{language === 'vi' ? 'Admin (Quyền Tùy Chỉnh)' : 'Admin (Custom Permissions)'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {user.role === 'superadmin' && (userForm.watch('role') === 'admin' || userForm.watch('role') === 'editor') && (
                  <FormField
                    control={userForm.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'vi' ? 'Quyền Hạn' : 'Permissions'}</FormLabel>
                        <div className="border border-white/10 rounded-none p-4 space-y-3">
                          {AVAILABLE_PERMISSIONS.map((perm) => (
                            <div key={perm.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={field.value?.includes(perm.id)}
                                onCheckedChange={(checked) => {
                                  const newPermissions = checked
                                    ? [...(field.value || []), perm.id]
                                    : (field.value || []).filter((p: string) => p !== perm.id);
                                  field.onChange(newPermissions);
                                }}
                                data-testid={`checkbox-permission-${perm.id}`}
                              />
                              <label
                                htmlFor={`perm-${perm.id}`}
                                className="text-sm font-light cursor-pointer"
                              >
                                {language === 'vi' ? perm.labelVi : perm.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsUserDialogOpen(false);
                      setEditingUser(null);
                      userForm.reset();
                    }}
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    data-testid="button-save-user"
                  >
                    {editingUser ? (language === 'vi' ? 'Cập Nhật' : 'Update User') : (language === 'vi' ? 'Tạo Người Dùng' : 'Create User')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {language === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Mật Khẩu Hiện Tại' : 'Current Password'}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập mật khẩu hiện tại' : 'Enter current password'}
                data-testid="input-current-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Mật Khẩu Mới' : 'New Password'}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'vi' ? 'Nhập mật khẩu mới (tối thiểu 6 ký tự)' : 'Enter new password (min 6 characters)'}
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{language === 'vi' ? 'Xác Nhận Mật Khẩu Mới' : 'Confirm New Password'}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm new password'}
                data-testid="input-confirm-password"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangePasswordDialogOpen(false);
                  setChangePasswordUserId(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                onClick={submitPasswordChange}
                disabled={changePasswordMutation.isPending}
                data-testid="button-submit-password"
              >
                {language === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                    <div className="h-8 bg-muted rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-light mb-2">{language === 'vi' ? 'Không tìm thấy người dùng' : 'No users found'}</h3>
              <p className="text-muted-foreground">{language === 'vi' ? 'Tạo người dùng admin đầu tiên để bắt đầu.' : 'Create your first admin user to get started.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px] whitespace-nowrap">{language === 'vi' ? 'Tên Đăng Nhập' : 'Username'}</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">{language === 'vi' ? 'Tên Hiển Thị' : 'Display Name'}</TableHead>
                  <TableHead className="w-[100px] whitespace-nowrap">{language === 'vi' ? 'Vai Trò' : 'Role'}</TableHead>
                  <TableHead className="whitespace-nowrap">{language === 'vi' ? 'Quyền Hạn' : 'Permissions'}</TableHead>
                  <TableHead className="w-[100px] text-right whitespace-nowrap"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((tableUser: any) => (
                  <TableRow key={tableUser.id} data-testid={`row-user-${tableUser.id}`}>
                    <TableCell className="font-medium">{tableUser.username}</TableCell>
                    <TableCell>{tableUser.displayName || "—"}</TableCell>
                    <TableCell>
                      <span className="text-white text-[14px]">
                        {tableUser.role === 'superadmin' ? 'Super Admin' : tableUser.role === 'admin' ? 'Admin' : 'Editor'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tableUser.role === 'superadmin' ? (
                        <span className="text-white text-sm">{language === 'vi' ? 'Toàn Quyền' : 'Full Access'}</span>
                      ) : Array.isArray(tableUser.permissions) && tableUser.permissions.length > 0 ? (
                        <span className="text-white text-sm">
                          {tableUser.permissions.length >= AVAILABLE_PERMISSIONS.length
                            ? (language === 'vi' ? 'Toàn Quyền' : 'Full Access')
                            : tableUser.permissions.map((p: string) => {
                                const perm = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
                                return perm ? (language === 'vi' ? perm.labelVi : perm.label) : p;
                              }).join(', ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">{language === 'vi' ? 'Chưa có quyền' : 'No permissions'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(tableUser)}
                          data-testid={`button-edit-user-${tableUser.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePassword(tableUser.id)}
                          data-testid={`button-change-password-${tableUser.id}`}
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        {user.role === 'superadmin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-white/30 hover:bg-white/10 hover:border-white"
                                disabled={tableUser.role === 'superadmin' && adminUsers.filter((u: any) => u.role === 'superadmin').length === 1}
                                data-testid={`button-delete-user-${tableUser.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'vi' ? 'Xóa Người Dùng?' : 'Delete User?'}</AlertDialogTitle>
                                <AlertDialogDescription className="text-white/70">
                                  {language === 'vi' 
                                    ? <>Xóa vĩnh viễn người dùng <strong className="text-white">"{tableUser.username}"</strong>.<br /><span className="!text-red-400">Hành động này không thể hoàn tác.</span></>
                                    : <>This will permanently delete the user <strong className="text-white">"{tableUser.username}"</strong>.<br /><span className="!text-red-400">This action cannot be undone.</span></>
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{language === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-none"
                                  onClick={() => deleteUserMutation.mutate(tableUser.id)}
                                >
                                  {language === 'vi' ? 'Xóa' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}