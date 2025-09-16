import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, Upload, Download, RefreshCw, Settings, Bell, Mail } from 'lucide-react';

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  currency: string;
  taxRate: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  documentCreated: boolean;
  userRegistered: boolean;
  paymentReceived: boolean;
  quotationExpired: boolean;
}

const SystemSettings: React.FC = () => {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'Aces Movers',
    email: 'info@acesmovers.com',
    phone: '+256 700 000 000',
    address: 'Kampala, Uganda',
    currency: 'UGX',
    taxRate: 18
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    documentCreated: true,
    userRegistered: true,
    paymentReceived: true,
    quotationExpired: true
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'notifications' | 'templates'>('company');

  const handleCompanySettingsChange = (field: keyof CompanySettings, value: string | number) => {
    setCompanySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationSettingsChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save company settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Company settings saved successfully!');
    } catch (error) {
      console.error('Failed to save company settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = () => {
    const settings = {
      company: companySettings,
      notifications: notificationSettings,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aces-movers-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'templates', label: 'Templates', icon: Edit }
  ];

  const renderCompanySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={companySettings.name}
            onChange={(e) => handleCompanySettingsChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={companySettings.email}
            onChange={(e) => handleCompanySettingsChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={companySettings.phone}
            onChange={(e) => handleCompanySettingsChange('phone', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={companySettings.currency}
            onChange={(e) => handleCompanySettingsChange('currency', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
          >
            <option value="UGX">Ugandan Shilling (UGX)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea
          value={companySettings.address}
          onChange={(e) => handleCompanySettingsChange('address', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={companySettings.taxRate}
          onChange={(e) => handleCompanySettingsChange('taxRate', parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={saveCompanySettings}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 font-medium disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </button>
        
        <button
          onClick={exportSettings}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Settings
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Email Notification Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => handleNotificationSettingsChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Document Created</label>
              <p className="text-sm text-gray-500">Notify when documents are created</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.documentCreated}
                onChange={(e) => handleNotificationSettingsChange('documentCreated', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">User Registered</label>
              <p className="text-sm text-gray-500">Notify when new users are registered</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.userRegistered}
                onChange={(e) => handleNotificationSettingsChange('userRegistered', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Payment Received</label>
              <p className="text-sm text-gray-500">Notify when payments are received</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.paymentReceived}
                onChange={(e) => handleNotificationSettingsChange('paymentReceived', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Quotation Expired</label>
              <p className="text-sm text-gray-500">Notify when quotations expire</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.quotationExpired}
                onChange={(e) => handleNotificationSettingsChange('quotationExpired', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={saveNotificationSettings}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 font-medium disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderTemplateSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h4 className="font-medium text-gray-900 mb-4">PDF Templates</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div>
                <div className="font-medium text-gray-900">Quotation Template</div>
                <div className="text-sm text-gray-500">Standard quotation format</div>
              </div>
              <button className="text-aces-green hover:text-aces-green/80">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div>
                <div className="font-medium text-gray-900">Receipt Template</div>
                <div className="text-sm text-gray-500">Standard receipt format</div>
              </div>
              <button className="text-aces-green hover:text-aces-green/80">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-lg p-6"
        >
          <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div>
                <div className="font-medium text-gray-900">Welcome Email</div>
                <div className="text-sm text-gray-500">New user welcome template</div>
              </div>
              <button className="text-aces-green hover:text-aces-green/80">
                <Mail className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div>
                <div className="font-medium text-gray-900">Password Reset</div>
                <div className="text-sm text-gray-500">Password reset template</div>
              </div>
              <button className="text-aces-green hover:text-aces-green/80">
                <Mail className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div>
                <div className="font-medium text-gray-900">Document Notification</div>
                <div className="text-sm text-gray-500">Document creation notification</div>
              </div>
              <button className="text-aces-green hover:text-aces-green/80">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return renderCompanySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'templates':
        return renderTemplateSettings();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? "border-aces-green text-aces-green"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`mr-2 w-5 h-5 ${
                    isActive ? "text-aces-green" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
};

export default SystemSettings;