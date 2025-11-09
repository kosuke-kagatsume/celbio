'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { currentUser, mockNotifications } from '@/lib/mock-data';
import { WorkScope } from '@/lib/types';

export default function NewQuotePage() {
  const [workScope, setWorkScope] = useState<WorkScope>('パネル+設置工事+電気工事');
  const [capacity, setCapacity] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const userNotifications = mockNotifications.filter(n => n.userId === currentUser.id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('見積依頼を送信しました！（モック）');
    window.location.href = '/contractor/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} notifications={userNotifications} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/contractor/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>新規見積依頼</CardTitle>
            <CardDescription>
              太陽光発電システムの見積を依頼します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 工事範囲 */}
              <div className="space-y-2">
                <Label htmlFor="workScope">
                  工事範囲 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={workScope}
                  onValueChange={(value) => setWorkScope(value as WorkScope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="パネルのみ">パネルのみ</SelectItem>
                    <SelectItem value="パネル+設置工事">パネル+設置工事</SelectItem>
                    <SelectItem value="パネル+設置工事+電気工事">
                      パネル+設置工事+電気工事
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {workScope === 'パネルのみ' && '全国対応'}
                  {workScope === 'パネル+設置工事' && '対応エリア: 中国、四国、九州'}
                  {workScope === 'パネル+設置工事+電気工事' &&
                    '対応エリア: 近畿、福井県、岐阜県、三重県、愛知県、静岡県'}
                </p>
              </div>

              {/* 希望容量 */}
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  希望容量 <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="capacity"
                    type="text"
                    placeholder="例: 7.27"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <span className="flex items-center px-3 bg-gray-100 rounded-md text-gray-600">
                    kW
                  </span>
                </div>
              </div>

              {/* 建築地住所 */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  建築地住所 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="例: 滋賀県近江八幡市〇〇町123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* 資料アップロード */}
              <div className="space-y-2">
                <Label>資料アップロード</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    配置図、平面図、立面図、屋根仕上げ材資料などをアップロード
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF形式（最大10MB）</p>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" className="mt-4" asChild>
                      <span>ファイルを選択</span>
                    </Button>
                  </Label>
                </div>

                {/* アップロード済みファイル一覧 */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-100 p-2 rounded">
                            <Upload className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* コメント */}
              <div className="space-y-2">
                <Label htmlFor="comment">コメント</Label>
                <Textarea
                  id="comment"
                  placeholder="特記事項や要望があればご記入ください"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              {/* 送信ボタン */}
              <div className="flex gap-4">
                <Link href="/contractor/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                  見積依頼を送信
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
