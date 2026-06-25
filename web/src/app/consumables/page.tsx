'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';
import { toast } from '@/components/Toast';
import { exportToExcel } from '@/lib/export';

export default function ConsumablesPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [consumables, setConsumables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [showAdd, setShowAdd] = useState(false);
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState({ id: '', name: '', category: 'Toner', minQuantity: 0, location: '', notes: '', unit: 'pcs' });
  
  const [newConsumable, setNewConsumable] = useState({ name: '', category: 'Toner', quantity: 0, minQuantity: 0, location: '', notes: '', unit: 'pcs' });
  const [adjustData, setAdjustData] = useState({ quantityChange: 0, reason: '' });

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const res = await fetch('/api/consumables');
      const data = await res.json();
      setConsumables(data.consumables || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async () => {
    const columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Current Qty', key: 'quantity', width: 15 },
      { header: 'Min Qty', key: 'minQuantity', width: 15 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];
    await exportToExcel('Consumables_Inventory', 'Consumables', columns, filteredConsumables);
    toast.success('Consumables exported successfully');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...newConsumable })
      });
      setShowAdd(false);
      setNewConsumable({ name: '', category: 'Toner', quantity: 0, minQuantity: 0, location: '', notes: '', unit: 'pcs' });
      fetchConsumables();
      toast.success('Consumable added successfully');
    } catch (e) {
      toast.error('Failed to add consumable');
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust', id: showAdjust, ...adjustData })
      });
      setShowAdjust(null);
      setAdjustData({ quantityChange: 0, reason: '' });
      fetchConsumables();
      toast.success('Quantity adjusted successfully');
    } catch (e) {
      toast.error('Failed to adjust quantity');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', ...editItem })
      });
      setShowEdit(false);
      fetchConsumables();
      toast.success('Consumable updated successfully');
    } catch (e) {
      toast.error('Failed to edit consumable');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetch('/api/consumables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      fetchConsumables();
      toast.success('Consumable deleted successfully');
    } catch (e) {
      toast.error('Failed to delete consumable');
    }
  };

  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const categories = ['All', ...Array.from(new Set(consumables.map(c => c.category).filter(Boolean)))];

  const filteredConsumables = consumables.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const totalPages = Math.ceil(filteredConsumables.length / ITEMS_PER_PAGE) || 1;
  const paginatedConsumables = filteredConsumables.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Consumables</h2>
            <p className={styles.subtitle}>Manage inventory for toners, cables, and other supplies.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search consumables..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '250px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
              <svg style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            
            <select 
              value={categoryFilter} 
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', minWidth: '150px' }}
            >
              {categories.map(c => (
                <option key={c as string} value={c as string}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>

            <button onClick={handleExport} style={{ padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Consumable
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Item Name</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Location</th>
                  <th style={{ padding: '1rem' }}>Stock Level</th>
                  <th style={{ padding: '1rem' }}>Notes</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsumables.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No consumables found.</td></tr>
                ) : (
                  paginatedConsumables.map(item => {
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700,
                            background: isLow ? '#fee2e2' : 'var(--bg-secondary)', 
                            color: isLow ? '#ef4444' : 'var(--text-primary)' 
                          }}>
                            {item.quantity} {item.unit || 'pcs'} {isLow && ' (Low Stock)'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>{item.notes || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowAdjust(item.id)} style={{ padding: '0.4rem 0.8rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              Adjust Stock
                            </button>
                            <button onClick={() => { setEditItem(item); setShowEdit(true); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                            <button onClick={() => handleDelete(item.id)} style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {consumables.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Showing {Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, filteredConsumables.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredConsumables.length)} of {filteredConsumables.length} entries
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

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Add Consumable</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Item Name</label>
                <input required type="text" value={newConsumable.name} onChange={e => setNewConsumable({...newConsumable, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                <input 
                  type="text" 
                  list="consumable-categories" 
                  required 
                  value={newConsumable.category} 
                  onChange={e => setNewConsumable({...newConsumable, category: e.target.value})} 
                  placeholder="e.g. Toner, Battery, Cable..." 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Unit</label>
                <input required type="text" value={newConsumable.unit} onChange={e => setNewConsumable({...newConsumable, unit: e.target.value})} placeholder="e.g. pcs, meters, boxes" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Initial Quantity</label>
                  <input type="number" min="0" value={newConsumable.quantity} onChange={e => setNewConsumable({...newConsumable, quantity: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Min Alert Qty</label>
                  <input type="number" min="0" value={newConsumable.minQuantity} onChange={e => setNewConsumable({...newConsumable, minQuantity: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Storage Location</label>
                <input type="text" value={newConsumable.location} onChange={e => setNewConsumable({...newConsumable, location: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notes</label>
                <textarea rows={3} value={newConsumable.notes} onChange={e => setNewConsumable({...newConsumable, notes: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '400px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Adjust Stock</h3>
            <form onSubmit={(e) => {
              const currentItem = consumables.find(c => c.id === showAdjust);
              if (currentItem && currentItem.quantity + adjustData.quantityChange < 0) {
                e.preventDefault();
                alert(`Cannot subtract more than available stock (${currentItem.quantity})!`);
                return;
              }
              handleAdjust(e);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quantity Change (+ / -)</label>
                <input required type="number" value={adjustData.quantityChange} onChange={e => setAdjustData({...adjustData, quantityChange: parseInt(e.target.value)})} placeholder="e.g. -1 for checkout, +5 for restock" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Reason</label>
                <input required type="text" value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value})} placeholder="e.g. given to Budi" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdjust(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Edit Consumable</h3>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Item Name</label>
                <input required type="text" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
                <input 
                  type="text" 
                  list="consumable-categories" 
                  required 
                  value={editItem.category || ''} 
                  onChange={e => setEditItem({...editItem, category: e.target.value})} 
                  placeholder="e.g. Toner, Battery, Cable..." 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Unit</label>
                <input required type="text" value={editItem.unit || ''} onChange={e => setEditItem({...editItem, unit: e.target.value})} placeholder="e.g. pcs, meters, boxes" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Min Alert Qty</label>
                <input type="number" min="0" value={editItem.minQuantity} onChange={e => setEditItem({...editItem, minQuantity: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Storage Location</label>
                <input type="text" value={editItem.location || ''} onChange={e => setEditItem({...editItem, location: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notes</label>
                <textarea rows={3} value={editItem.notes || ''} onChange={e => setEditItem({...editItem, notes: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEdit(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dynamic Datalist for Categories */}
      <datalist id="consumable-categories">
        {Array.from(new Set(consumables.map(c => c.category))).filter(Boolean).map(cat => (
          <option key={cat as string} value={cat as string} />
        ))}
      </datalist>

    </div>
  );
}
