'use client';
import { useState, useEffect } from 'react';
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
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', priority: '' });

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    if (params.id) {
      fetchTicketData();
    }
  }, [params.id]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${params.id}`);
      const data = await res.json();
      if (data.ticket) {
        setTicket(data.ticket);
        setEditForm({ status: data.ticket.status, priority: data.ticket.priority });
      }

      const commentsRes = await fetch(`/api/tickets/${params.id}/comments`);
      const commentsData = await commentsRes.json();
      setComments(commentsData.comments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
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
      alert('Failed to add comment');
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
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
                  <button onClick={() => setIsEditing(true)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    Edit Status
                  </button>
                  <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}>
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
                    <div key={c.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>System User</span>
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
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical', marginBottom: '1rem' }}
                />
                <button type="submit" disabled={!newComment.trim()} style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', background: newComment.trim() ? 'var(--accent-primary)' : '#cbd5e1', color: 'white', fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}>
                  Post Comment
                </button>
              </form>
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
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
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
                    <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{ticket.priority}</span>
                  )}
                </div>

                {ticket.agentId && (
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Related Asset</span>
                    <Link href={`/assets/${ticket.agentId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {ticket.agentHostname || 'Asset Details'}
                    </Link>
                  </div>
                )}
                
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
          </div>
        </div>
      </section>
    </div>
  );
}
