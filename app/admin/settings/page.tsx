'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Receipt, Bell, History, Save, Loader2 } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const actionLabels: Record<string, string> = {
  create: '作成',
  update: '更新',
  delete: '削除',
  approve: '承認',
};

const entityLabels: Record<string, string> = {
  user: 'ユーザー',
  order: '発注',
  quote: '見積',
  invoice: '請求書',
  payment: '入金',
  member: '加盟店',
  partner: 'メーカー',
  product: '商材',
  system_setting: 'システム設定',
};

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string | null>>({});

  // 監査ログ用
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [logFilters, setLogFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
  });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [logPage, logFilters]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', logPage.toString());
      params.append('limit', '20');
      if (logFilters.userId) params.append('userId', logFilters.userId);
      if (logFilters.action) params.append('action', logFilters.action);
      if (logFilters.entityType) params.append('entityType', logFilters.entityType);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setLogTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string | null) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert('設定を保存しました');
      } else {
        const error = await response.json();
        alert(error.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">システム設定の管理</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            会社情報
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Receipt className="h-4 w-4" />
            請求・支払
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            通知設定
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            監査ログ
          </TabsTrigger>
        </TabsList>

        {/* 会社情報タブ */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>会社情報</CardTitle>
              <CardDescription>会社の基本情報を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="company_name">会社名</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name || ''}
                    onChange={(e) => handleSettingChange('company_name', e.target.value)}
                    placeholder="セリビオ株式会社"
                  />
                </div>
                <div>
                  <Label htmlFor="company_phone">電話番号</Label>
                  <Input
                    id="company_phone"
                    value={settings.company_phone || ''}
                    onChange={(e) => handleSettingChange('company_phone', e.target.value)}
                    placeholder="03-1234-5678"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_address">住所</Label>
                <Input
                  id="company_address"
                  value={settings.company_address || ''}
                  onChange={(e) => handleSettingChange('company_address', e.target.value)}
                  placeholder="東京都..."
                />
              </div>
              <div>
                <Label htmlFor="company_email">代表メールアドレス</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={settings.company_email || ''}
                  onChange={(e) => handleSettingChange('company_email', e.target.value)}
                  placeholder="info@celibio.com"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 請求・支払タブ */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>請求・支払設定</CardTitle>
              <CardDescription>請求書と支払いに関する設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="tax_rate">消費税率 (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={settings.tax_rate || '10'}
                    onChange={(e) => handleSettingChange('tax_rate', e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_due_days">支払期限日数</Label>
                  <Input
                    id="payment_due_days"
                    type="number"
                    value={settings.payment_due_days || '30'}
                    onChange={(e) => handleSettingChange('payment_due_days', e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">請求書発行日からの日数</p>
                </div>
                <div>
                  <Label htmlFor="payment_tolerance">入金差異許容額 (円)</Label>
                  <Input
                    id="payment_tolerance"
                    type="number"
                    value={settings.payment_tolerance || '0'}
                    onChange={(e) => handleSettingChange('payment_tolerance', e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">自動消込時の許容差異</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知設定タブ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>メール通知の有効/無効を設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>見積依頼通知</Label>
                  <p className="text-sm text-muted-foreground">新規見積依頼時にメール送信</p>
                </div>
                <Switch
                  checked={settings.notify_quote_request === 'true'}
                  onCheckedChange={(checked) =>
                    handleSettingChange('notify_quote_request', checked ? 'true' : 'false')
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>発注通知</Label>
                  <p className="text-sm text-muted-foreground">新規発注時にメール送信</p>
                </div>
                <Switch
                  checked={settings.notify_order === 'true'}
                  onCheckedChange={(checked) =>
                    handleSettingChange('notify_order', checked ? 'true' : 'false')
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>請求書通知</Label>
                  <p className="text-sm text-muted-foreground">請求書発行時にメール送信</p>
                </div>
                <Switch
                  checked={settings.notify_invoice === 'true'}
                  onCheckedChange={(checked) =>
                    handleSettingChange('notify_invoice', checked ? 'true' : 'false')
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>入金通知</Label>
                  <p className="text-sm text-muted-foreground">入金確認時にメール送信</p>
                </div>
                <Switch
                  checked={settings.notify_payment === 'true'}
                  onCheckedChange={(checked) =>
                    handleSettingChange('notify_payment', checked ? 'true' : 'false')
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 監査ログタブ */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>監査ログ</CardTitle>
              <CardDescription>システム操作の履歴</CardDescription>
            </CardHeader>
            <CardContent>
              {/* フィルター */}
              <div className="flex gap-4 mb-4">
                <Select
                  value={logFilters.userId || 'all'}
                  onValueChange={(value) =>
                    setLogFilters({ ...logFilters, userId: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="ユーザー" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのユーザー</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={logFilters.action || 'all'}
                  onValueChange={(value) =>
                    setLogFilters({ ...logFilters, action: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="操作" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての操作</SelectItem>
                    <SelectItem value="create">作成</SelectItem>
                    <SelectItem value="update">更新</SelectItem>
                    <SelectItem value="delete">削除</SelectItem>
                    <SelectItem value="approve">承認</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={logFilters.entityType || 'all'}
                  onValueChange={(value) =>
                    setLogFilters({ ...logFilters, entityType: value === 'all' ? '' : value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="対象" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="user">ユーザー</SelectItem>
                    <SelectItem value="order">発注</SelectItem>
                    <SelectItem value="quote">見積</SelectItem>
                    <SelectItem value="invoice">請求書</SelectItem>
                    <SelectItem value="payment">入金</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {logsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ログがありません
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日時</TableHead>
                        <TableHead>ユーザー</TableHead>
                        <TableHead>操作</TableHead>
                        <TableHead>対象</TableHead>
                        <TableHead>ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell>{log.user?.name || '-'}</TableCell>
                          <TableCell>{actionLabels[log.action] || log.action}</TableCell>
                          <TableCell>{entityLabels[log.entityType] || log.entityType}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.entityId.substring(0, 8)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {logTotalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logPage === 1}
                        onClick={() => setLogPage(logPage - 1)}
                      >
                        前へ
                      </Button>
                      <span className="flex items-center px-4">
                        {logPage} / {logTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logPage === logTotalPages}
                        onClick={() => setLogPage(logPage + 1)}
                      >
                        次へ
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
