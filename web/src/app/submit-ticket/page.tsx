'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SubmitTicketPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Hardware',
    priority: 'Medium',
    employeeId: '',
    agentId: '',
    reporterName: '', // For users not in the system
    assetId: '',
    email: '',
    otp: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [viewMode, setViewMode] = useState<'submit' | 'status'>('submit');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/employees').then(res => res.json()).then(data => setEmployees(data.employees || []));
  }, []);

  const createTicket = async () => {
    let finalDescription = formData.description;
    let reporterInfo = [];
    if (!formData.employeeId && formData.reporterName) {
      reporterInfo.push(`[Reported by: ${formData.reporterName}]`);
    }
    if (formData.email) {
      reporterInfo.push(`[Email: ${formData.email}]`);
    }
    if (reporterInfo.length > 0) {
      finalDescription = `${reporterInfo.join('\n')}\n\n${finalDescription}`;
    }

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: finalDescription,
          category: formData.category,
          priority: formData.priority,
          employeeId: formData.employeeId || null,
          email: formData.email
        })
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          title: '', description: '', category: 'Hardware', priority: 'Medium', employeeId: '', agentId: '', reporterName: '', email: '', otp: ''
        });
        setOtpSent(false);
        setOtpVerified(false);
      } else {
        const errorData = await res.json();
        alert(`Failed to submit ticket: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      alert("Email is required.");
      return;
    }

    setLoading(true);

    if (!otpVerified) {
      // Send OTP
      try {
        const res = await fetch('/api/tickets/otp/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        if (res.ok) {
          setOtpSent(true);
        } else {
          const err = await res.json();
          alert(err.error || "Failed to send OTP");
        }
      } catch (e) {
        console.error(e);
        alert("Error requesting OTP");
      } finally {
        setLoading(false);
      }
      return;
    }

    // If somehow it's already verified, just submit
    await createTicket();
  };



  const handleVerifyOTP = async () => {
    if (!formData.otp) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/tickets/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      if (res.ok) {
        setOtpVerified(true);
        setLoading(true);
        await createTicket();
      } else {
        const err = await res.json();
        alert(err.error || "Invalid OTP");
      }
    } catch (e) {
      console.error(e);
      alert("Error verifying OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!formData.employeeId && !formData.reporterName) {
      alert("Please select an employee or enter your name.");
      return;
    }
    setIsSearching(true);
    setHasSearched(false);
    setCurrentPage(1);
    try {
      const queryParams = new URLSearchParams();
      if (formData.employeeId) {
        queryParams.append('employeeId', formData.employeeId);
      } else if (formData.reporterName) {
        queryParams.append('reporterName', formData.reporterName);
      }
      
      const res = await fetch(`/api/tickets?${queryParams.toString()}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await res.json();
      setMyTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#0f172a' }}>Ticket Submitted!</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your IT helpdesk ticket has been successfully received. Our IT staff will review it shortly and get back to you.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              style={primaryBtnStyle}
              className="modern-btn"
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        .modern-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modern-input:focus {
          outline: none;
          background: #ffffff !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
        }
        .modern-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modern-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3) !important;
        }
        .modern-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .modern-tab-active {
          background: #ffffff !important;
          color: #3b82f6 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
        }
        .modern-tab-inactive:hover {
          color: #1e293b !important;
          background: rgba(255,255,255,0.6) !important;
        }
      `}</style>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconWrapperStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h1 style={titleStyle}>IT Helpdesk</h1>
          <p style={subtitleStyle}>Submit a new support request or check your ticket status.</p>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <button 
            type="button"
            className={viewMode === 'submit' ? 'modern-tab-active' : 'modern-tab-inactive'}
            onClick={() => setViewMode('submit')}
            style={viewMode === 'submit' ? activeTabStyle : inactiveTabStyle}
          >
            Submit New Ticket
          </button>
          <button 
            type="button"
            className={viewMode === 'status' ? 'modern-tab-active' : 'modern-tab-inactive'}
            onClick={() => setViewMode('status')}
            style={viewMode === 'status' ? activeTabStyle : inactiveTabStyle}
          >
            Check Status
          </button>
        </div>

        {viewMode === 'submit' ? (
        <>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={{...labelStyle, fontWeight: 500}}>Employee Profile</label>
              <select 
                style={inputStyle} 
                value={formData.employeeId} 
                onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value);
                  setFormData({
                    ...formData, 
                    employeeId: e.target.value, 
                    email: emp ? (emp.email || '') : ''
                  });
                  setOtpSent(false);
                  setOtpVerified(false);
                }}
              >
                <option value="">-- I am not in the list --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
            {!formData.employeeId && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Your Name</label>
                <input 
                  type="text" 
                  required
                  className="modern-input"
                  style={inputStyle} 
                  placeholder="Enter your full name"
                  value={formData.reporterName}
                  onChange={e => setFormData({...formData, reporterName: e.target.value})}
                  disabled={otpVerified}
                />
              </div>
            )}
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Your Email (Verification required to submit)</label>
            <input 
              type="email" 
              required
              className="modern-input"
              style={inputStyle} 
              placeholder="employee@company.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              readOnly={!!formData.employeeId}
            />
          </div>

          {otpVerified && (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Email Verified Successfully
            </div>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle}>Issue Title</label>
            <input 
              type="text" 
              required
              className="modern-input"
              style={inputStyle} 
              placeholder="E.g. Cannot connect to the office WiFi network"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div style={rowStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Category</label>
              <select 
                className="modern-input"
                style={inputStyle} 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Hardware">Hardware (PC, Laptop, Printer)</option>
                <option value="Software">Software & Apps</option>
                <option value="Network">Network & Internet</option>
                <option value="Access">Account Access / Password</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Priority</label>
              <select 
                className="modern-input"
                style={inputStyle} 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Low">Low - Not urgent</option>
                <option value="Medium">Medium - Standard issue</option>
                <option value="High">High - Blocking my work</option>
                <option value="Critical">Critical - System down</option>
              </select>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Description of the Issue</label>
            <textarea 
              required
              rows={5}
              className="modern-input"
              style={{...inputStyle, resize: 'vertical'}} 
              placeholder="Provide steps to reproduce, error messages, or context..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={loading ? { ...primaryBtnStyle, opacity: 0.6, cursor: 'not-allowed' } : primaryBtnStyle}
            className="modern-btn"
          >
            {loading ? 'Processing...' : 'Submit Ticket'}
          </button>
        </form>

        {/* OTP Verification Modal */}
        {otpSent && !otpVerified && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>Verify Your Email</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                An OTP has been sent to <strong>{formData.email}</strong>. Please enter the 6-digit code below to confirm your ticket submission.
              </p>
              
              <div style={formGroupStyle}>
                <input 
                  type="text" 
                  maxLength={6}
                  autoFocus
                  className="modern-input"
                  style={{...inputStyle, letterSpacing: '8px', fontSize: '1.5rem', textAlign: 'center', padding: '1rem'}} 
                  placeholder="------"
                  value={formData.otp}
                  onChange={e => setFormData({...formData, otp: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)}
                  style={{...primaryBtnStyle, background: '#f1f5f9', color: '#475569', boxShadow: 'none', marginTop: 0}}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleVerifyOTP}
                  disabled={verifyingOtp || formData.otp.length < 6}
                  style={{...primaryBtnStyle, marginTop: 0, ...(verifyingOtp || formData.otp.length < 6 ? {opacity: 0.6, cursor: 'not-allowed'} : {})}}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify & Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={rowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Employee Profile</label>
                <select 
                  className="modern-input"
                  style={inputStyle} 
                  value={formData.employeeId} 
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                >
                  <option value="">-- I am not in the list --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>
              {!formData.employeeId && (
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Guest Name</label>
                  <input 
                    type="text" 
                    required
                    className="modern-input"
                    style={inputStyle} 
                    placeholder="Enter the exact name used in the ticket"
                    value={formData.reporterName}
                    onChange={e => setFormData({...formData, reporterName: e.target.value})}
                  />
                </div>
              )}
            </div>
            
            <button 
              type="button"
              onClick={handleCheckStatus}
              disabled={isSearching}
              style={{...primaryBtnStyle, marginTop: 0}}
            >
              {isSearching ? 'Searching...' : 'Search Tickets'}
            </button>

            {hasSearched && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Your Tickets ({myTickets.length})</h3>
                {myTickets.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    No tickets found for this name.
                  </div>
                ) : (
                  <>
                    {myTickets.slice((currentPage - 1) * 5, currentPage * 5).map(t => (
                      <div key={t.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 600 }}>{t.title}</h4>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            backgroundColor: t.status === 'Open' ? 'rgba(59,130,246,0.1)' : t.status === 'In Progress' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            color: t.status === 'Open' ? '#3b82f6' : t.status === 'In Progress' ? '#f59e0b' : '#10b981'
                          }}>
                            {t.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                          <span>Category: {t.category}</span>
                          <span>•</span>
                          <span>Priority: {t.priority}</span>
                          <span>•</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    
                    {Math.ceil(myTickets.length / 5) > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <button 
                          type="button" 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#0f172a', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                          Page {currentPage} of {Math.ceil(myTickets.length / 5)}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(myTickets.length / 5), p + 1))}
                          disabled={currentPage === Math.ceil(myTickets.length / 5)}
                          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === Math.ceil(myTickets.length / 5) ? '#f8fafc' : '#fff', color: currentPage === Math.ceil(myTickets.length / 5) ? '#94a3b8' : '#0f172a', cursor: currentPage === Math.ceil(myTickets.length / 5) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- STYLES ---

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '700px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.05)',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.5rem'
};

const iconWrapperStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 0.5rem',
  color: 'white',
  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  margin: '0 0 0.5rem 0',
  color: '#0f172a',
  letterSpacing: '-0.5px'
};

const subtitleStyle: React.CSSProperties = {
  color: '#64748b',
  margin: 0,
  fontSize: '0.9rem'
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.85rem'
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  flex: 1
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginLeft: '0.2rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  color: '#0f172a',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
  marginTop: '1rem'
};

const activeTabStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: '#fff',
  border: 'none',
  borderRadius: '8px',
  color: '#0f172a',
  fontWeight: 600,
  fontSize: '0.95rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const inactiveTabStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: '#64748b',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.2s'
};
