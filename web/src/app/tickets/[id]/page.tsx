'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [logoName, setLogoName] = useState('ITAM');
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', priority: '', agentId: '' });
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetch('/api/assets/list').then(r => r.json()).then(d => setAssets(d.assets || []));
    if (params.id) {
      fetchTicketData();
    }
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setCurrentUser(d.user);
    }).catch(console.error);
  }, [params.id]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${params.id}`);
      const data = await res.json();
      if (data.ticket) {
        setTicket(data.ticket);
        setEditForm({ status: data.ticket.status, priority: data.ticket.priority, agentId: data.ticket.agentId || '' });
      }

      const commentsRes = await fetch(`/api/tickets/${params.id}/comments`);
      const commentsData = await commentsRes.json();
      setComments(commentsData.comments || []);

      const historyRes = await fetch(`/api/tickets/${params.id}/history`);
      const historyData = await historyRes.json();
      setHistory(historyData.history || []);

      const attRes = await fetch(`/api/attachments/entity/TICKET/${params.id}`);
      const attData = await attRes.json();
      if (attData.attachments) setAttachments(attData.attachments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      const payload = { ...editForm, agentId: editForm.agentId || null };
      await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIsEditing(false);
      fetchTicketData();
    } catch (e) {
      alert('Failed to update ticket');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await fetch(`/api/tickets/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      setNewComment('');
      fetchTicketData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'TICKET');
    formData.append('entityId', params.id as string);

    try {
      const res = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setAttachments([data.attachment, ...attachments]);
      } else {
        alert(data.error || 'Failed to upload');
      }
    } catch (err) {
      alert('Error uploading file');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAttachments(attachments.filter(a => a.id !== attachmentId));
      }
    } catch (err) {
      alert('Failed to delete attachment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await fetch(`/api/tickets/${params.id}`, { method: 'DELETE' });
      router.push('/tickets');
    } catch (e) {
      alert('Failed to delete ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return '#ef4444';
      case 'In Progress': return '#f59e0b';
      case 'Resolved': return '#3b82f6';
      case 'Closed': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <Sidebar logoName={logoName} />
        <section className={styles.main}>
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {/* Skeleton Header */}
            <div style={{ height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', width: '40%', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ height: '20px', background: 'var(--bg-secondary)', borderRadius: '4px', width: '20%', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '20px', background: 'var(--bg-secondary)', borderRadius: '4px', width: '30%', animation: 'pulse 1.5s infinite' }}></div>
            </div>
            
            {/* Skeleton Content */}
            <div style={{ height: '200px', background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', animation: 'pulse 1.5s infinite', marginTop: '1rem' }}></div>
            <div style={{ height: '300px', background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', animation: 'pulse 1.5s infinite' }}></div>
            
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
            `}</style>
          </div>
        </section>
      </div>
    );
  }
  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>Ticket not found</div>;

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/tickets" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Tickets
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>{ticket.title}</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>ID: {ticket.id.split('-')[0]}</span>
                <span>•</span>
                <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                {ticket.category && (
                  <>
                    <span>•</span>
                    <span>Category: {ticket.category}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Edit Status
                  </button>
                  <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleUpdateTicket} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{ticket.description}</p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Discussion ({comments.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments yet.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.authorName || 'System User'}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment}>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical', marginBottom: '1rem' }}
                />
                <button type="submit" disabled={!newComment.trim()} style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', background: newComment.trim() ? 'var(--accent-primary)' : '#cbd5e1', color: 'white', fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}>
                  Post Comment
                </button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 600, margin: 0 }}>Attachments</h3>
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    Upload File
                  </button>
                </div>
              </div>
              
              {attachments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No attachments yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {attachments.map(att => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <a href={att.fileUrl} target="_blank" rel="noreferrer" style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</a>
                        <p suppressHydrationWarning style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(att.fileSize / 1024).toFixed(1)} KB • {new Date(att.createdAt).toLocaleDateString()}</p>
                      </div>
                      {currentUser?.role === 'admin' && (
                        <button onClick={() => handleDeleteAttachment(att.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Status</span>
                  {isEditing ? (
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  ) : (
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: getStatusColor(ticket.status) + '20', color: getStatusColor(ticket.status) }}>
                      {ticket.status}
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Priority</span>
                  {isEditing ? (
                    <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{ticket.priority}</span>
                  )}
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Related Asset</span>
                  {isEditing ? (
                    <select value={editForm.agentId || ''} onChange={e => setEditForm({...editForm, agentId: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      <option value="">-- No Specific Asset / General --</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.hostname} ({a.category})</option>
                      ))}
                    </select>
                  ) : ticket.agentId ? (
                    <Link href={`/asset/${ticket.agentId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {ticket.agentHostname || 'Asset Details'}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>- Umum / No Asset -</span>
                  )}
                </div>
                
                {ticket.employeeId && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Related Employee</span>
                    <span style={{ fontWeight: 600 }}>{ticket.employeeName || 'Unknown Employee'}</span>
                  </div>
                )}
                
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Last Updated</span>
                  <span style={{ fontSize: '0.9rem' }}>{new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* History Log */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Log Perubahan Status</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada perubahan status.</p>
                ) : (
                  history.map(h => (
                    <div key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.changedBy || 'System User'}</span>
                        <span>{new Date(h.changedAt).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ padding: '0.1rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(h.oldStatus) + '20', color: getStatusColor(h.oldStatus), fontWeight: 600, fontSize: '0.75rem' }}>
                          {h.oldStatus}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ padding: '0.1rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(h.newStatus) + '20', color: getStatusColor(h.newStatus), fontWeight: 600, fontSize: '0.75rem' }}>
                          {h.newStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
