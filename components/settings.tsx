'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    citationMode: true,
    strictMode: true,
    autoDelete: false,
    emailNotifications: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your KnowledgeStream preferences</p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">AI Behavior</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Show Source Citations</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Display document sources in AI responses
                  </p>
                </div>
                <Switch
                  checked={settings.citationMode}
                  onCheckedChange={() => handleToggle('citationMode')}
                />
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium text-foreground">Strict Mode</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only answer questions that can be directly answered from your documents
                    </p>
                  </div>
                  <Switch
                    checked={settings.strictMode}
                    onCheckedChange={() => handleToggle('strictMode')}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Document Management */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Document Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Auto-delete old files</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically remove documents older than 90 days
                  </p>
                </div>
                <Switch
                  checked={settings.autoDelete}
                  onCheckedChange={() => handleToggle('autoDelete')}
                />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-foreground">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive email updates about document processing status
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
            </div>
          </Card>

          {/* Account Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Storage Usage</p>
                  <p className="text-sm text-muted-foreground mt-1">2.4 GB of 10 GB used</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Danger Zone</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 bg-transparent">
                Delete All Documents
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 bg-transparent">
                Clear Chat History
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 bg-transparent">
                Delete Account
              </Button>
            </div>
          </Card>

          {/* Save */}
          <div className="flex gap-3 pt-4">
            <Button className="gap-2">Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
