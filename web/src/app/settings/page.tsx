'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import LogoIcon from '@/components/LogoIcon';
<<<<<<< HEAD
=======
import Sidebar from '@/components/Sidebar';
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)

export default function SettingsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/agent/report');
  const [logRetentionDays, setLogRetentionDays] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
<<<<<<< HEAD
=======
  const [activeTab, setActiveTab] = useState('profile');
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
  
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

<<<<<<< HEAD
=======
    const interval = setInterval(() => {
      const hash = window.location.hash.replace('#', '') || 'profile';
      setActiveTab(current => hash !== current ? hash : current);
    }, 100);

>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
    fetch('/api/settings/get')
      .then(res => res.json())
      .then(data => {
        if (data.logoName) setLogoName(data.logoName);
        if (data.serverUrl) setServerUrl(data.serverUrl);
        if (data.logRetentionDays) setLogRetentionDays(data.logRetentionDays);
      });
      
    fetchUsers();
<<<<<<< HEAD
=======
    
    return () => clearInterval(interval);
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
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
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logoName', value: logoName }),
      });
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'serverUrl', value: serverUrl }),
      });
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logRetentionDays', value: logRetentionDays }),
      });
      router.refresh(); 
      alert('Settings saved!');
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

  const handleUpdateMe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMe(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: myUsername, 
          password: myPassword || undefined 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Profile updated successfully!');
      setMyPassword('');
      if (myUsername !== currentUser?.username) {
        // If username changed, they might need to login again depending on session
        fetch('/api/auth/me').then(r => r.json()).then(d => {
          if (d.authenticated) {
            setCurrentUser(d.user);
            setMyUsername(d.user.username);
          }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
    setIsUpdatingMe(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={styles.dashboard}>
<<<<<<< HEAD
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            {logoName.substring(0, logoName.length - 2)}<span>{logoName.substring(logoName.length - 2)}</span>
          </div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </a>
            <a href="/assets" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
              Assets
            </a>
            <a href="/logs" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Logs
            </a>
            <a href="/settings" className={`${styles.navItem} ${styles.active}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Settings
            </a>
          </nav>
          
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleLogout} className={styles.actionBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        </aside>
=======
<Sidebar logoName={logoName} />
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)

        <section className={styles.main}>
          <header className={styles.header}>
            <h2>Settings</h2>
          </header>

<<<<<<< HEAD
          <div className={styles.tableSection}>
            <h2>My Profile</h2>
            <form onSubmit={handleUpdateMe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', marginBottom: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Username</label>
                <input required type="text" className={styles.search} style={{ width: '100%' }} value={myUsername} onChange={e => setMyUsername(e.target.value)} />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                <input type="password" placeholder="Leave blank to keep current" className={styles.search} style={{ width: '100%' }} value={myPassword} onChange={e => setMyPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={isUpdatingMe} className={styles.actionBtn} style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'white', marginTop: '1rem', alignSelf: 'flex-start' }}>
                {isUpdatingMe ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {currentUser?.role === 'admin' && (
            <>
              <div className={styles.tableSection}>
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
          </div>

          <div className={styles.tableSection}>
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
              {isSaving ? 'Saving...' : 'Save All Settings'}
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

          {users.length > 0 && (
            <div className={styles.tableSection}>
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
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDeleteUser(user.id)} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
=======
          {activeTab === 'profile' && (
            <div id="profile" className={styles.tableSection}>
              <h2>My Profile</h2>
              <form onSubmit={handleUpdateMe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', marginBottom: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Username</label>
                  <input required type="text" className={styles.search} style={{ width: '100%' }} value={myUsername} onChange={e => setMyUsername(e.target.value)} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                  <input type="password" placeholder="Leave blank to keep current" className={styles.search} style={{ width: '100%' }} value={myPassword} onChange={e => setMyPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={isUpdatingMe} className={styles.actionBtn} style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'white', marginTop: '1rem', alignSelf: 'flex-start' }}>
                  {isUpdatingMe ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

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
                    {isSaving ? 'Saving...' : 'Save All Settings'}
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
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button onClick={() => handleDeleteUser(user.id)} className={styles.actionBtn} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
            </>
          )}
        </section>
      </div>
  );
}
