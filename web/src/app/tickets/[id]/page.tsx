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

  const handleSaveEmployee = async () => {
    const nameMatch = ticket.description.match(/\[Reported by: (.*?)\]/);
    const emailMatch = ticket.description.match(/\[Email: (.*?)\]/);
    
    let name = nameMatch ? nameMatch[1] : 'Unknown Guest';
    let email = emailMatch ? emailMatch[1] : '';
    
    if (!email) {
      const emailInput = prompt(`No email found for ${name}.\\nPlease enter their email address:`, '');
      if (emailInput === null) return; // user cancelled
      email = emailInput.trim();
    }

    const department = prompt(`Create new employee record for ${name} (${email})?\\n\\nEnter their Department:`, 'Unknown');
    if (department === null) return; // cancelled
    
    try {
      const empRes = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department })
      });
      const empData = await empRes.json();
      
      if (empData.success) {
        await fetch(`/api/tickets/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: empData.id })
        });
        alert('Employee created and linked to this ticket successfully!');
        fetchTicketData();
      } else {
        alert(empData.error || 'Failed to create employee');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating employee');
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
  const parseDescription = (desc: string) => {
    if (!desc) return { reporter: null, email: null, cleanDesc: '' };
    
    let reporter = null;
    let email = null;
    let cleanDesc = desc;

    const reporterMatch = cleanDesc.match(/\[Reported by: (.*?)\]/);
    if (reporterMatch) {
      reporter = reporterMatch[1];
      cleanDesc = cleanDesc.replace(reporterMatch[0], '');
    }

    const emailMatch = cleanDesc.match(/\[Email: (.*?)\]/);
    if (emailMatch) {
      email = emailMatch[1];
      cleanDesc = cleanDesc.replace(emailMatch[0], '');
    }

    const deletedMatch = cleanDesc.match(/\[Original Reporter \(Deleted Employee\): (.*?) \| Email: (.*?)\]/);
    if (deletedMatch) {
      reporter = deletedMatch[1] + ' (Deleted Profile)';
      email = deletedMatch[2];
      cleanDesc = cleanDesc.replace(deletedMatch[0], '');
    }

    return { reporter, email, cleanDesc: cleanDesc.trim() };
  };

  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>Ticket not found</div>;

  const { reporter, email, cleanDesc } = parseDescription(ticket.description);

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main} style={{ background: 'var(--bg-background)' }}>
        
        {/* Modern Header Banner */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: '24px', 
          padding: '2rem', 
          border: 'var(--glass-border)', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.05))', pointerEvents: 'none' }}></div>
          
          <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Tickets
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  TKT-{ticket.id.split('-')[0].toUpperCase()}
                </span>
                {ticket.category && (
                  <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {ticket.category}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', margin: '0.5rem 0 1rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{ticket.title}</h2>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit Status
                  </button>
                  <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.2rem', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.background = '#fca5a5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'}} onMouseOut={e => {e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '0.7rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleUpdateTicket} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: 'var(--accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Description Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '2rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Description</h3>
              </div>
              
              {(reporter || email) && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.2rem', 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  marginBottom: '2rem',
                  boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.5)'
                }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.8rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}>
                    {reporter ? reporter.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?')}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '0.3rem' }}>Original Reporter</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{reporter || 'Unknown'}</span>
                      {email && email !== '-' && (
                        <span style={{ background: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                          {email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-primary)', background: 'var(--bg-background)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>{cleanDesc}</p>
            </div>

            {/* Modern Discussion Section */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '2rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Discussion</h3>
                </div>
                <span style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {comments.length} comments
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-background)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>No discussion yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {(c.authorName || 'S')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.authorName || 'System User'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div style={{ background: 'var(--bg-background)', padding: '1rem 1.2rem', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{c.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                  {currentUser && currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type your comment here..."
                    rows={3}
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-background)', color: 'var(--text-primary)', resize: 'vertical', marginBottom: '1rem', fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={!newComment.trim()} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: newComment.trim() ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: newComment.trim() ? 'white' : 'var(--text-muted)', fontWeight: 700, cursor: newComment.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Attachments Section */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '2rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Attachments</h3>
                </div>
                <div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--bg-background)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseOver={e => {e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'}} onMouseOut={e => {e.currentTarget.style.background = 'var(--bg-background)'; e.currentTarget.style.borderColor = 'var(--border-color)'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Upload File
                  </button>
                </div>
              </div>
              
              {attachments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-background)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                  No attachments provided.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {attachments.map(att => (
                    <div key={att.id} onClick={() => window.open(att.fileUrl, '_blank')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-background)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}} onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'}}>
                      <div style={{ width: '100%', height: '80px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.2rem' }}>{att.fileName}</span>
                      <p suppressHydrationWarning style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(att.fileSize / 1024).toFixed(1)} KB</p>
                      
                      {currentUser?.role === 'admin' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(att.id); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '24px', height: '24px', borderRadius: '50%', background: 'white', border: '1px solid #fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 2 }} onMouseOver={e => { e.stopPropagation(); e.currentTarget.style.background = '#fee2e2'; }} onMouseOut={e => { e.stopPropagation(); e.currentTarget.style.background = 'white'; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Details Panel */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>Ticket Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Status</span>
                    {isEditing ? (
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--accent-primary)', outline: 'none' }}>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, backgroundColor: getStatusColor(ticket.status) + '15', color: getStatusColor(ticket.status), border: `1px solid ${getStatusColor(ticket.status)}40`, display: 'inline-block' }}>
                        {ticket.status}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Priority</span>
                    {isEditing ? (
                      <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--accent-primary)', outline: 'none' }}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ticket.priority}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Related Asset</span>
                    {isEditing ? (
                      <select value={editForm.agentId || ''} onChange={e => setEditForm({...editForm, agentId: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--accent-primary)', outline: 'none' }}>
                        <option value="">-- No Specific Asset --</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.hostname} ({a.category})</option>
                        ))}
                      </select>
                    ) : ticket.agentId ? (
                      <Link href={`/asset/${ticket.agentId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
                        {ticket.agentHostname || 'Asset Details'}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>- General / No Asset -</span>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Linked Employee</span>
                    {ticket.employeeId ? (
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ticket.employeeName || 'Unknown Employee'}</span>
                    ) : (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>- Guest / Unlinked -</span>
                        <button 
                          onClick={handleSaveEmployee} 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Save Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* History Panel */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Timeline</h3>
              </div>
              
              <div style={{ position: 'relative', paddingLeft: '0.5rem' }}>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No status changes recorded.</p>
                ) : (
                  <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {history.map((h, i) => (
                      <div key={h.id} style={{ position: 'relative' }}>
                        {/* Timeline dot */}
                        <div style={{ position: 'absolute', left: '-1.55rem', top: '0.2rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--bg-card)', border: `2px solid ${getStatusColor(h.newStatus)}` }}></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(h.changedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{h.changedBy || 'System User'}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>changed status</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'line-through' }}>
                              {h.oldStatus}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            <span style={{ color: getStatusColor(h.newStatus), fontWeight: 700, fontSize: '0.85rem' }}>
                              {h.newStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
