/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { 
  Users, FileText, Trash2, Shield, Copy, Eye, LayoutDashboard, 
  ChevronRight, ShieldAlert, Edit, Download, Check, X, Search
} from 'lucide-react';
import { api, type PromptWithAuthor, type Profile } from '../../lib/api';
import { DeleteConfirmationModal } from '../../components/Modal/DeleteConfirmationModal';
import './AdminScreen.css';

interface AdminScreenProps {
  user: User | null;
  isAdmin?: boolean;
}

export function AdminScreen({ user, isAdmin = false }: AdminScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = useCallback((): 'prompts' | 'users' | 'analytics' | 'moderation' => {
    const path = location.pathname;
    if (path.endsWith('/prompts')) return 'prompts';
    if (path.endsWith('/users')) return 'users';
    if (path.endsWith('/moderation')) return 'moderation';
    return 'analytics';
  }, [location.pathname]);

  const activeTab = getTabFromPath();

  const [prompts, setPrompts] = useState<PromptWithAuthor[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Prompts filter & pagination state
  const [promptSearch, setPromptSearch] = useState('');
  const [promptStatusFilter, setPromptStatusFilter] = useState<'all' | 'published' | 'draft' | 'deleted'>('all');
  const [promptPage, setPromptPage] = useState(0);

  // Users filter & pagination state
  const [userSearch, setUserSearch] = useState('');
  const [userSubFilter, setUserSubFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [userBanFilter, setUserBanFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [userPage, setUserPage] = useState(0);

  // Moderation filter state
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'prompts' || activeTab === 'analytics') {
        const p = await api.getAllPromptsAdmin();
        setPrompts(p);
      }
      if (activeTab === 'users' || activeTab === 'analytics') {
        const u = await api.getAllUsersAdmin();
        setUsers(u);
      }
      if (activeTab === 'moderation') {
        const r = await api.getAllReportsAdmin();
        setReports(r);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setPromptPage(0);
  }, [promptSearch, promptStatusFilter]);

  useEffect(() => {
    setUserPage(0);
  }, [userSearch, userSubFilter, userBanFilter]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setPromptToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePrompt(promptToDelete);
      // Update local state to reflect soft delete
      setPrompts(prev => prev.map(p => p.id === promptToDelete ? { ...p, deleted_at: new Date().toISOString() } : p));
      setDeleteModalOpen(false);
      setPromptToDelete(null);
    } catch (err) {
      console.error('Failed to delete prompt', err);
      alert('Failed to delete prompt.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Ban Toggle
  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    if (isBanned) {
      if (window.confirm("Are you sure you want to unban this user?")) {
        try {
          await api.unbanUserAdmin(userId);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned_at: null, ban_reason: null } : u));
        } catch (err) {
          console.error(err);
          alert("Failed to unban user.");
        }
      }
    } else {
      const reason = window.prompt("Enter ban reason:");
      if (reason === null) return;
      try {
        await api.banUserAdmin(userId, reason || "Violating terms of service");
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned_at: new Date().toISOString(), ban_reason: reason || "Violating terms of service" } : u));
      } catch (err) {
        console.error(err);
        alert("Failed to ban user.");
      }
    }
  };

  // Resolve report
  const handleResolveReport = async (reportId: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateReportStatus(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
      alert('Failed to resolve report.');
    }
  };

  // Remove reported prompt
  const handleRemoveReportedPrompt = async (reportId: string, promptId: string) => {
    if (!window.confirm("Are you sure you want to soft-delete this prompt?")) return;
    try {
      await api.deletePrompt(promptId);
      await api.updateReportStatus(reportId, 'resolved');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      // Sync prompts list if loaded
      setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, deleted_at: new Date().toISOString() } : p));
      alert('Prompt soft-deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete prompt.');
    }
  };

  // CSV Export
  const handleExportCSV = (type: 'prompts' | 'users') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'prompts') {
      headers = ['ID', 'Title', 'Author', 'Status', 'Views', 'Copies', 'Deleted At'];
      rows = prompts.map(p => [
        p.id || '',
        p.title || '',
        p.author?.username || p.author?.full_name || 'Anonymous',
        p.deleted_at ? 'deleted' : (p.status || ''),
        (p.views_count || 0).toString(),
        (p.copies_count || 0).toString(),
        p.deleted_at || ''
      ]);
      filename = 'prompts_export.csv';
    } else {
      headers = ['ID', 'Name', 'Username', 'Subscription', 'Banned At', 'Ban Reason'];
      rows = users.map(u => [
        u.id || '',
        u.full_name || 'Anonymous',
        u.username || '',
        u.subscription_tier || 'free',
        u.banned_at || '',
        u.ban_reason || ''
      ]);
      filename = 'users_export.csv';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter lists
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(promptSearch.toLowerCase()) ||
      (p.author?.username || '').toLowerCase().includes(promptSearch.toLowerCase()) ||
      (p.author?.full_name || '').toLowerCase().includes(promptSearch.toLowerCase());
    
    if (promptStatusFilter === 'all') return matchesSearch;
    if (promptStatusFilter === 'published') return p.status === 'published' && !p.deleted_at && matchesSearch;
    if (promptStatusFilter === 'draft') return p.status === 'draft' && !p.deleted_at && matchesSearch;
    if (promptStatusFilter === 'deleted') return !!p.deleted_at && matchesSearch;
    return matchesSearch;
  });

  const paginatedPrompts = filteredPrompts.slice(promptPage * pageSize, (promptPage + 1) * pageSize);
  const totalPromptPages = Math.ceil(filteredPrompts.length / pageSize);

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesSub = userSubFilter === 'all' || u.subscription_tier === userSubFilter;
    
    const matchesBan = userBanFilter === 'all' || 
      (userBanFilter === 'active' && !u.banned_at) ||
      (userBanFilter === 'banned' && !!u.banned_at);
      
    return matchesSearch && matchesSub && matchesBan;
  });

  const paginatedUsers = filteredUsers.slice(userPage * pageSize, (userPage + 1) * pageSize);
  const totalUserPages = Math.ceil(filteredUsers.length / pageSize);

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true;
    if (reportFilter === 'pending') return r.status === 'pending';
    return r.status !== 'pending';
  });

  // Analytics Metrics (active non-deleted items)
  const activePrompts = prompts.filter(p => !p.deleted_at);
  const totalViews = activePrompts.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalCopies = activePrompts.reduce((sum, p) => sum + (p.copies_count || 0), 0);
  const totalPrompts = activePrompts.length;
  const totalUsers = users.length;

  // Sorting for most viewed and copied prompts charts
  const topViewedPrompts = [...activePrompts]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);
  
  const topCopiedPrompts = [...activePrompts]
    .sort((a, b) => (b.copies_count || 0) - (a.copies_count || 0))
    .slice(0, 5);

  const maxViews = topViewedPrompts[0]?.views_count || 1;
  const maxCopies = topCopiedPrompts[0]?.copies_count || 1;

  return (
    <div className="admin-screen">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <Shield size={24} className="admin-icon" />
          <h2>Admin Portal</h2>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <LayoutDashboard size={18} />
            Analytics
            <ChevronRight size={16} className="chevron" />
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => navigate('/admin/prompts')}
          >
            <FileText size={18} />
            Prompt Management
            <ChevronRight size={16} className="chevron" />
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            <Users size={18} />
            User Management
            <ChevronRight size={16} className="chevron" />
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => navigate('/admin/moderation')}
          >
            <ShieldAlert size={18} />
            Moderation Queue
            <ChevronRight size={16} className="chevron" />
          </button>
        </nav>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="admin-profile">
            <span className="admin-badge">Admin</span>
            <span className="admin-email">{user?.email}</span>
          </div>
        </div>

        <div className="admin-main">
          {loading ? (
            <div className="admin-loading">Loading data...</div>
          ) : (
            <>
              {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div className="analytics-grid">
                    <div className="stat-card">
                      <div className="stat-icon bg-blue"><FileText size={20} /></div>
                      <div className="stat-details">
                        <h3>Total Prompts</h3>
                        <p>{totalPrompts}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon bg-green"><Users size={20} /></div>
                      <div className="stat-details">
                        <h3>Total Users</h3>
                        <p>{totalUsers}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon bg-purple"><Eye size={20} /></div>
                      <div className="stat-details">
                        <h3>Total Views</h3>
                        <p>{totalViews}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon bg-orange"><Copy size={20} /></div>
                      <div className="stat-details">
                        <h3>Total Copies</h3>
                        <p>{totalCopies}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trend Analytics Custom CSS Graphs */}
                  <div className="admin-charts-row">
                    <div className="admin-chart-card">
                      <h3>Top Viewed Prompts</h3>
                      <div className="chart-container">
                        {topViewedPrompts.map(p => {
                          const percent = Math.max(8, Math.round(((p.views_count || 0) / maxViews) * 100));
                          return (
                            <div key={p.id} className="chart-bar-row">
                              <span className="chart-bar-label" title={p.title}>{p.title}</span>
                              <div className="chart-bar-wrapper">
                                <div className="chart-bar-fill views-bg" style={{ width: `${percent}%` }} />
                                <span className="chart-bar-value">{p.views_count || 0}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="admin-chart-card">
                      <h3>Top Copied Prompts</h3>
                      <div className="chart-container">
                        {topCopiedPrompts.map(p => {
                          const percent = Math.max(8, Math.round(((p.copies_count || 0) / maxCopies) * 100));
                          return (
                            <div key={p.id} className="chart-bar-row">
                              <span className="chart-bar-label" title={p.title}>{p.title}</span>
                              <div className="chart-bar-wrapper">
                                <div className="chart-bar-fill copies-bg" style={{ width: `${percent}%` }} />
                                <span className="chart-bar-value">{p.copies_count || 0}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prompts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Search and Filters Bar */}
                  <div className="admin-filters-bar">
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search prompts by title or author..." 
                        value={promptSearch}
                        onChange={(e) => setPromptSearch(e.target.value)}
                      />
                    </div>
                    <select 
                      value={promptStatusFilter}
                      onChange={(e) => setPromptStatusFilter(e.target.value as any)}
                      className="filter-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                      <option value="deleted">Soft Deleted</option>
                    </select>
                    <button 
                      className="btn-export-csv" 
                      onClick={() => handleExportCSV('prompts')}
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Prompt</th>
                          <th>Author</th>
                          <th>Status</th>
                          <th>Stats</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPrompts.length > 0 ? (
                          paginatedPrompts.map(prompt => (
                            <tr key={prompt.id}>
                              <td>
                                <div className="td-prompt">
                                  {prompt.image_url && <img src={prompt.image_url} alt="" />}
                                  <div className="td-prompt-text">
                                    <strong>{prompt.title}</strong>
                                    <span>{prompt.categories?.[0]?.name || 'Uncategorized'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{prompt.author?.username ? `@${prompt.author.username}` : (prompt.author?.full_name || 'Anonymous')}</td>
                              <td>
                                {prompt.deleted_at ? (
                                  <span className="status-badge deleted">deleted</span>
                                ) : (
                                  <span className={`status-badge ${prompt.status}`}>
                                    {prompt.status}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="td-stats">
                                  <span><Eye size={14} /> {prompt.views_count || 0}</span>
                                  <span><Copy size={14} /> {prompt.copies_count || 0}</span>
                                </div>
                              </td>
                              <td>
                                <div className="td-actions-row">
                                  <button 
                                    className="btn-icon-action" 
                                    onClick={() => navigate(`/edit/${prompt.id}`)}
                                    title="Edit Prompt"
                                    aria-label="Edit prompt"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  {!prompt.deleted_at && (
                                    <button 
                                      className="btn-icon danger" 
                                      onClick={() => handleDeleteClick(prompt.id)}
                                      title="Delete Prompt"
                                      aria-label="Delete prompt"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                              No prompts found matching criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalPromptPages > 1 && (
                    <div className="admin-pagination">
                      <button 
                        disabled={promptPage === 0} 
                        onClick={() => setPromptPage(p => p - 1)}
                      >
                        Previous
                      </button>
                      <span>Page {promptPage + 1} of {totalPromptPages}</span>
                      <button 
                        disabled={promptPage >= totalPromptPages - 1} 
                        onClick={() => setPromptPage(p => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Search and Filters Bar */}
                  <div className="admin-filters-bar">
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search users by name, username or ID..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <select 
                      value={userSubFilter}
                      onChange={(e) => setUserSubFilter(e.target.value as any)}
                      className="filter-select"
                    >
                      <option value="all">All Tiers</option>
                      <option value="free">Free Tier</option>
                      <option value="pro">Pro Tier</option>
                    </select>
                    <select 
                      value={userBanFilter}
                      onChange={(e) => setUserBanFilter(e.target.value as any)}
                      className="filter-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="banned">Banned Only</option>
                    </select>
                    <button 
                      className="btn-export-csv" 
                      onClick={() => handleExportCSV('users')}
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>ID</th>
                          <th>Joined</th>
                          <th>Subscription</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.length > 0 ? (
                          paginatedUsers.map(u => (
                            <tr key={u.id}>
                              <td>
                                <div className="td-user">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" />
                                  ) : (
                                    <div className="avatar-placeholder">{u.full_name?.[0] || 'U'}</div>
                                  )}
                                  <div className="td-user-text">
                                    <strong>{u.full_name || 'Anonymous'}</strong>
                                    <span>@{u.username || 'unknown'}</span>
                                  </div>
                                </div>
                              </td>
                              <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.id.substring(0, 8)}...</span></td>
                              <td>{new Date(u.created_at).toLocaleDateString()}</td>
                              <td>
                                <span className={`status-badge ${u.subscription_tier}`}>
                                  {u.subscription_tier?.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                {u.banned_at ? (
                                  <span className="status-badge banned" title={`Reason: ${u.ban_reason}`}>Banned</span>
                                ) : (
                                  <span className="status-badge active-user">Active</span>
                                )}
                              </td>
                              <td>
                                <button 
                                  className={`btn-ban-action ${u.banned_at ? 'unban' : 'ban'}`}
                                  onClick={() => handleBanToggle(u.id, !!u.banned_at)}
                                >
                                  {u.banned_at ? 'Unban' : 'Ban'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                              No users found matching criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalUserPages > 1 && (
                    <div className="admin-pagination">
                      <button 
                        disabled={userPage === 0} 
                        onClick={() => setUserPage(p => p - 1)}
                      >
                        Previous
                      </button>
                      <span>Page {userPage + 1} of {totalUserPages}</span>
                      <button 
                        disabled={userPage >= totalUserPages - 1} 
                        onClick={() => setUserPage(p => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'moderation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Moderation Controls */}
                  <div className="admin-filters-bar">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="filter-label">Filter Reports:</span>
                      <select 
                        value={reportFilter}
                        onChange={(e) => setReportFilter(e.target.value as any)}
                        className="filter-select"
                      >
                        <option value="all">All Reports</option>
                        <option value="pending">Pending Only</option>
                        <option value="resolved">Resolved / Processed</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Reported Prompt</th>
                          <th>Reporter</th>
                          <th>Reason</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.length > 0 ? (
                          filteredReports.map(report => (
                            <tr key={report.id}>
                              <td>
                                <div className="td-prompt-text">
                                  <strong>{report.prompt?.title || 'Unknown Prompt'}</strong>
                                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{report.prompt_id}</span>
                                </div>
                              </td>
                              <td>
                                {report.reporter ? (
                                  <div className="td-user-text">
                                    <strong>{report.reporter.full_name || 'Reporter'}</strong>
                                    <span>@{report.reporter.username || 'user'}</span>
                                  </div>
                                ) : (
                                  'Anonymous'
                                )}
                              </td>
                              <td style={{ maxWidth: 220, overflowWrap: 'anywhere' }}>
                                <p style={{ fontSize: 13, margin: 0, color: 'var(--text-secondary)' }}>{report.reason}</p>
                              </td>
                              <td>{new Date(report.created_at).toLocaleDateString()}</td>
                              <td>
                                <span className={`status-badge report-${report.status}`}>
                                  {report.status}
                                </span>
                              </td>
                              <td>
                                {report.status === 'pending' ? (
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button 
                                      className="btn-mod-action approve"
                                      onClick={() => handleResolveReport(report.id, 'approved')}
                                      title="Keep Prompt (Dismiss Report)"
                                    >
                                      <Check size={14} />
                                      Dismiss
                                    </button>
                                    <button 
                                      className="btn-mod-action remove"
                                      onClick={() => handleRemoveReportedPrompt(report.id, report.prompt_id)}
                                      title="Remove Prompt (Soft Delete)"
                                    >
                                      <X size={14} />
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Resolved</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                              No reports in the queue.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setPromptToDelete(null);
          }
        }}
      />
    </div>
  );
}

