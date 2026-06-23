'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import LogoIcon from '@/components/LogoIcon';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/agent/report');
  const [logRetentionDays, setLogRetentionDays] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Current User State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myUsername, setMyUsername] = useState('');
  const [myPassword, setMyPassword] = useState('');
  const [isUpdatingMe, setIsUpdatingMe] = useState(false);
  
  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
          setMyUsername(data.user.username);
        }
      });

    const interval = setInterval(() => {
      const hash = window.location.hash.replace('#', '') || 'general';
      setActiveTab(current => hash !== current ? hash : current);
    }, 100);

    fetch('/api/settings/get')
      .then(res => res.json())
      .then(data => {
        if (data.logoName) setLogoName(data.logoName);
        if (data.serverUrl) setServerUrl(data.serverUrl);
        if (data.logRetentionDays) setLogRetentionDays(data.logRetentionDays);
      });
      
    fetchUsers();
    
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res1 = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logoName', value: logoName }),
      });
      if (!res1.ok) throw new Error('Failed to save logoName');

      const res2 = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'serverUrl', value: serverUrl }),
      });
      if (!res2.ok) throw new Error('Failed to save serverUrl');

      const res3 = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logRetentionDays', value: logRetentionDays }),
      });
      if (!res3.ok) throw new Error('Failed to save logRetentionDays');
      alert('Settings saved!');
      window.location.reload(); 
    } catch (e) {
      alert('Error saving settings');
    }
    setIsSaving(false);
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to delete all audit logs? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      alert('All logs deleted successfully!');
    } catch (e) {
      alert('Error deleting logs');
    }
    setIsClearing(false);
  };

  const handleBackup = () => {
    window.location.href = '/api/settings/backup';
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm('WARNING: Restoring a database will completely overwrite all current data. This action cannot be undone. Are you absolutely sure you want to proceed?')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Database restored successfully! The application will now reload.');
      window.location.href = '/'; 
    } catch (err: any) {
      alert(err.message || 'Error restoring database');
      e.target.value = '';
    }
    setIsRestoring(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('User added successfully');
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error adding user');
    }
    setIsAddingUser(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser && currentUser.id === id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('operator');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const openEditModal = (user: any) => {
    setEditUserId(user.id);
    setEditUsername(user.username);
    setEditPassword(''); // Keep blank
    setEditRole(user.role);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUser(true);
    try {
      const res = await fetch(`/api/users/${editUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editUsername, 
          password: editPassword || undefined,
          role: editRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('User updated successfully!');
      setShowEditModal(false);
      fetchUsers();
      
      if (editUserId === currentUser?.id && editUsername !== currentUser?.username) {
        // If own username changed, refetch ME
        fetch('/api/auth/me').then(r => r.json()).then(d => {
          if (d.authenticated) setCurrentUser(d.user);
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating user');
    }
    setIsUpdatingUser(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={styles.dashboard}>
<Sidebar logoName={logoName} />

        <section className={styles.main}>
          <header className={styles.header}>
            <h2>Settings</h2>
          </header>

          {currentUser?.role === 'admin' && (
            <>
              {activeTab === 'general' && (
                <div id="general" className={styles.tableSection}>
                  <h2>General Configuration</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', marginBottom: '2rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>App Logo Name</label>
                    <input 
                      type="text" 
                      value={logoName} 
                      onChange={(e) => setLogoName(e.target.value)}
                      className={styles.search}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <button 
                    onClick={saveSettings} 
                    className={styles.actionBtn} 
                    disabled={isSaving}
                    style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'white', marginBottom: '2rem' }}
                  >
                    {isSaving ? 'Saving...' : 'Save General Settings'}
                  </button>

                  <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Database Management</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '250px', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Backup Database</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Download a complete copy of your current database.</p>
                        <button onClick={handleBackup} className={styles.actionBtn} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', width: 'auto', padding: '0.6rem 1.5rem' }}>
                          Download Backup (.db)
                        </button>
                      </div>

                      <div style={{ flex: 1, minWidth: '250px', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--accent-danger)' }}>Restore Database</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Upload a .db file to overwrite and restore data.</p>
                        <label className={styles.actionBtn} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', width: 'auto', padding: '0.6rem 1.5rem', cursor: isRestoring ? 'wait' : 'pointer', display: 'inline-flex' }}>
                          {isRestoring ? 'Restoring...' : 'Upload & Restore'}
                          <input type="file" accept=".db" style={{ display: 'none' }} onChange={handleRestore} disabled={isRestoring} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'agent' && (
                <div id="agent" className={styles.tableSection}>
                  <h2>Agent Configuration</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', marginBottom: '2rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Target Server URL for Scanning</label>
                    <input 
                      type="text" 
                      value={serverUrl} 
                      onChange={(e) => setServerUrl(e.target.value)}
                      className={styles.search}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', marginBottom: '2rem' }}>
                    <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Log Retention (Days)</label>
                    <select
                      value={logRetentionDays}
                      onChange={(e) => setLogRetentionDays(e.target.value)}
                      className={styles.search}
                      style={{ width: '200px' }}
                    >
                      <option value="0">Keep Forever</option>
                      <option value="30">1 Month (30 Days)</option>
                      <option value="60">2 Months (60 Days)</option>
                      <option value="90">3 Months (90 Days)</option>
                    </select>
                  </div>

                  <button 
                    onClick={saveSettings} 
                    className={styles.actionBtn} 
                    disabled={isSaving}
                    style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'white', marginBottom: '2rem' }}
                  >
                    {isSaving ? 'Saving...' : 'Save Agent Settings'}
                  </button>
                  
                  <div style={{ marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>Danger Zone</h3>
                    <button 
                      onClick={clearLogs} 
                      className={styles.actionBtn} 
                      disabled={isClearing}
                      style={{ padding: '0.5rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--accent-danger)' }}
                    >
                      {isClearing ? 'Deleting...' : 'Delete All Logs'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'account' && users.length > 0 && (
                <div id="account" className={styles.tableSection}>
                  <h2>Account Management</h2>
                  <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <input required type="text" placeholder="Username" className={styles.search} value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                    <input required type="password" placeholder="Password" className={styles.search} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <select className={styles.search} value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '150px' }}>
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" disabled={isAddingUser} className={styles.actionBtn} style={{ background: 'var(--accent-primary)', color: 'white' }}>
                      {isAddingUser ? 'Adding...' : 'Add User'}
                    </button>
                  </form>

                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: 600 }}>{user.username}</td>
                          <td>
                            <span className={`${styles.status} ${user.role === 'admin' ? styles.online : styles.spare}`}>
                              {user.role}
                            </span>
                          </td>
                          <td suppressHydrationWarning>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => openEditModal(user)} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: '#3b82f6', color: 'white', border: 'none' }}>Edit</button>
                              <button onClick={() => handleDeleteUser(user.id)} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                </div>
              )}
            </>
          )}
        </section>

        {/* Edit User Modal */}
        {showEditModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Edit User</h3>
              <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Username</label>
                  <input required type="text" className={styles.search} style={{ width: '100%' }} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>New Password</label>
                  <input type="password" placeholder="Leave blank to keep current" className={styles.search} style={{ width: '100%' }} value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Role</label>
                  <select className={styles.search} style={{ width: '100%' }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowEditModal(false)} className={styles.actionBtn} style={{ background: 'transparent', color: 'var(--text-primary)' }}>Cancel</button>
                  <button type="submit" disabled={isUpdatingUser} className={styles.actionBtn} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none' }}>
                    {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
