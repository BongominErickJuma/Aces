import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Calendar,
  User,
  FileText,
  Shield,
  Activity,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { adminAPI, type AuditLog } from '../../../services/admin';

const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Sample data since audit logs endpoint might not be implemented yet
  const sampleAuditLogs: AuditLog[] = [
    {
      _id: '1',
      action: 'user_created',
      entityType: 'User',
      entityId: 'user123',
      userId: {
        _id: 'admin1',
        fullName: 'John Admin',
        email: 'admin@acesmovers.com'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        userAction: 'user_created',
        targetUserEmail: 'newuser@acesmovers.com'
      },
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      action: 'document_created',
      entityType: 'Quotation',
      entityId: 'quot123',
      userId: {
        _id: 'user1',
        fullName: 'Jane Smith',
        email: 'jane@acesmovers.com'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        quotationNumber: 'QUO-2024-001',
        clientName: 'ABC Company'
      },
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      _id: '3',
      action: 'login',
      entityType: 'User',
      entityId: 'user1',
      userId: {
        _id: 'user1',
        fullName: 'Jane Smith',
        email: 'jane@acesmovers.com'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: {
        authType: 'login',
        loginMethod: 'email'
      },
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, searchQuery, actionFilter, entityTypeFilter, userFilter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API, fall back to sample data
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          action: actionFilter || undefined,
          entityType: entityTypeFilter || undefined,
          userId: userFilter || undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined
        };

        const response = await adminAPI.getAuditLogs(params);
        setAuditLogs(response.data.logs || []);
        setPagination(response.data.pagination);
      } catch (error) {
        // Fall back to sample data if API is not implemented
        console.log('Using sample audit log data');
        const filteredLogs = sampleAuditLogs.filter(log => {
          const matchesSearch = searchQuery === '' || 
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.userId?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesAction = actionFilter === '' || log.action === actionFilter;
          const matchesEntity = entityTypeFilter === '' || log.entityType === entityTypeFilter;
          const matchesUser = userFilter === '' || log.userId?._id === userFilter;
          
          return matchesSearch && matchesAction && matchesEntity && matchesUser;
        });
        
        setAuditLogs(filteredLogs);
        setPagination({
          page: 1,
          limit: 50,
          total: filteredLogs.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap = {
      login: User,
      logout: User,
      user_created: User,
      user_updated: User,
      user_deleted: User,
      document_created: FileText,
      document_updated: FileText,
      document_deleted: FileText,
      security_alert: Shield,
      system_event: Activity
    };
    
    return iconMap[action as keyof typeof iconMap] || Activity;
  };

  const getActionColor = (action: string) => {
    const colorMap = {
      login: 'text-green-600',
      logout: 'text-gray-600',
      user_created: 'text-blue-600',
      user_updated: 'text-yellow-600',
      user_deleted: 'text-red-600',
      document_created: 'text-blue-600',
      document_updated: 'text-yellow-600',
      document_deleted: 'text-red-600',
      security_alert: 'text-red-600',
      system_event: 'text-purple-600'
    };
    
    return colorMap[action as keyof typeof colorMap] || 'text-gray-600';
  };

  const formatActionText = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const exportAuditLogs = () => {
    const dataToExport = auditLogs.map(log => ({
      timestamp: new Date(log.createdAt).toLocaleString(),
      action: formatActionText(log.action),
      entityType: log.entityType,
      user: log.userId?.fullName || 'System',
      userEmail: log.userId?.email || '',
      ipAddress: log.ipAddress || '',
      details: JSON.stringify(log.details)
    }));
    
    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-aces-green"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditLogs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          <button
            onClick={exportAuditLogs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-lg p-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="user_created">User Created</option>
                <option value="user_updated">User Updated</option>
                <option value="user_deleted">User Deleted</option>
                <option value="document_created">Document Created</option>
                <option value="document_updated">Document Updated</option>
                <option value="document_deleted">Document Deleted</option>
                <option value="security_alert">Security Alert</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
              >
                <option value="">All Types</option>
                <option value="User">User</option>
                <option value="Quotation">Quotation</option>
                <option value="Receipt">Receipt</option>
                <option value="System">System</option>
                <option value="Security">Security</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Audit Logs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">Loading audit logs...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {auditLogs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              const actionColor = getActionColor(log.action);
              
              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 ${actionColor}`}>
                      <ActionIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {formatActionText(log.action)}
                        </h4>
                        <time className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </time>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{log.entityType}</span>
                          {log.entityId && ` (${log.entityId})`}
                          {log.userId && (
                            <>
                              {' '}by{' '}
                              <span className="font-medium">{log.userId.fullName}</span>
                              <span className="text-gray-500"> ({log.userId.email})</span>
                            </>
                          )}
                        </p>
                      </div>
                      
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <details>
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                              View Details
                            </summary>
                            <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-aces-green">{auditLogs.length}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {auditLogs.filter(log => log.action.includes('user')).length}
            </div>
            <div className="text-sm text-gray-600">User Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {auditLogs.filter(log => log.action.includes('document')).length}
            </div>
            <div className="text-sm text-gray-600">Document Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.action.includes('security')).length}
            </div>
            <div className="text-sm text-gray-600">Security Events</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuditLogs;