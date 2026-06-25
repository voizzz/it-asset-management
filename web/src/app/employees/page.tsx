'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';
import { toast } from '@/components/Toast';
import { exportToExcel } from '@/lib/export';

export default function EmployeesPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [showAdd, setShowAdd] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', department: '', email: '' });
  const [showEdit, setShowEdit] = useState(false);
  const [editEmployee, setEditEmployee] = useState({ id: '', name: '', department: '', email: '' });

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    const columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Active Assets', key: 'assetCount', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 20 },
      { header: 'Tickets', key: 'ticketCount', width: 15 }
    ];
    await exportToExcel('Employees_Directory', 'Employees', columns, filteredEmployees);
    toast.success('Employees exported successfully');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      });
      setShowAdd(false);
      setNewEmployee({ name: '', department: '', email: '' });
      fetchEmployees();
      toast.success('Employee added successfully');
    } catch (e) {
      toast.error('Failed to add employee');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/employees/${editEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEmployee)
      });
      setShowEdit(false);
      fetchEmployees();
      toast.success('Employee updated successfully');
    } catch (e) {
      toast.error('Failed to edit employee');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
      toast.success('Employee deleted successfully');
    } catch (e) {
      toast.error('Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Employees</h2>
            <p className={styles.subtitle}>Manage staff directory and track assigned assets.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '250px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
              <svg style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <button onClick={handleExport} style={{ padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Employee
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Department</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Active Assets</th>
                  <th style={{ padding: '1rem' }}>Active Tickets</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td></tr>
                ) : (
                  paginatedEmployees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{emp.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{emp.department || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{emp.email || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        <Link href={`/assets?search=${encodeURIComponent(emp.name)}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          {emp.activeAssets} items
                        </Link>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        <Link href={`/tickets?search=${encodeURIComponent(emp.name)}`} style={{ color: '#d97706', textDecoration: 'none' }}>
                          {emp.activeTickets || 0} tickets
                        </Link>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => { setEditEmployee(emp); setShowEdit(true); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                          <button onClick={() => handleDelete(emp.id)} style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {employees.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Showing {Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, filteredEmployees.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} entries
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.5rem', fontWeight: 600 }}>{currentPage} / {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage >= totalPages}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage >= totalPages ? 'transparent' : 'var(--bg-secondary)', color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Add Employee</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Full Name</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Department</label>
                <input type="text" value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Edit Employee</h3>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Full Name</label>
                <input required type="text" value={editEmployee.name} onChange={e => setEditEmployee({...editEmployee, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Department</label>
                <input type="text" value={editEmployee.department} onChange={e => setEditEmployee({...editEmployee, department: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
                <input type="email" value={editEmployee.email} onChange={e => setEditEmployee({...editEmployee, email: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEdit(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
