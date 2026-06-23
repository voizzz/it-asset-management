'use client';
import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function ReportsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [activeTab, setActiveTab] = useState('assets');
  const [reportData, setReportData] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['assets', 'tickets', 'consumables'].includes(hash)) {
        setActiveTab(hash);
        // Reset filters when changing tabs
        setSearchQuery('');
        setCategoryFilter('All');
        setStatusFilter('All');
        setPriorityFilter('All');
        setLowStockOnly(false);
        setStartDate('');
        setEndDate('');
        setSortConfig(null);
        setCurrentPage(1);
      }
    };
    
    // Initial check
    if (typeof window !== 'undefined') {
      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (tab: string) => {
    try {
      const res = await fetch(`/api/reports?type=${tab}`);
      const data = await res.json();
      setReportData(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to normalize strings for grouping
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  // Extract unique filter options
  const uniqueCategories = useMemo(() => {
    const cats = reportData.map(item => item.category).filter(Boolean) as string[];
    return Array.from(new Set(cats.map(toTitleCase))).sort();
  }, [reportData]);

  const uniqueStatuses = useMemo(() => {
    const stats = reportData.map(item => item.status).filter(Boolean) as string[];
    return Array.from(new Set(stats.map(toTitleCase))).sort();
  }, [reportData]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return reportData.filter(item => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      
      // 2. Category Filter
      if (categoryFilter !== 'All') {
        if (toTitleCase(item.category || '') !== categoryFilter) return false;
      }
      
      // 3. Status Filter
      if (statusFilter !== 'All') {
        if (toTitleCase(item.status || '') !== statusFilter) return false;
      }
      
      // 4. Priority Filter
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      
      // 5. Low Stock Only
      if (lowStockOnly && activeTab === 'consumables') {
        const qty = Number(item.quantity) || 0;
        const minQty = Number(item.minQuantity) || 0;
        if (qty > minQty) return false;
      }

      // 6. Date Range Filter
      if (activeTab === 'tickets' && item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }
      
      return true;
    });
  }, [reportData, searchQuery, categoryFilter, statusFilter, priorityFilter, lowStockOnly, startDate, endDate, activeTab]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        // Handle numeric sorting for quantity
        if (sortConfig.key === 'quantity' || sortConfig.key === 'minQuantity') {
           const aNum = Number(aVal) || 0;
           const bNum = Number(bVal) || 0;
           return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const handleExportExcel = async () => {
    if (!sortedData || sortedData.length === 0) return alert('No data to export');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(toTitleCase(activeTab));

    // --- Corporate Header ---
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${logoName} - ${toTitleCase(activeTab)} Inventory Report`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Dark Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:E2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Metrics Summary ---
    worksheet.getCell('A4').value = 'Total Items:';
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('B4').value = filteredData.length;

    if (activeTab === 'assets') {
      worksheet.getCell('C4').value = 'Active/In-Use:';
      worksheet.getCell('C4').font = { bold: true };
      worksheet.getCell('D4').value = filteredData.filter(a => ['online', 'in-use'].includes(a.status)).length;
    } else if (activeTab === 'tickets') {
      worksheet.getCell('C4').value = 'Open/In Progress:';
      worksheet.getCell('C4').font = { bold: true };
      worksheet.getCell('D4').value = filteredData.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
    } else if (activeTab === 'consumables') {
      worksheet.getCell('C4').value = 'Low Stock:';
      worksheet.getCell('C4').font = { bold: true };
      worksheet.getCell('D4').value = filteredData.filter(c => (Number(c.quantity) || 0) <= (Number(c.minQuantity) || 0)).length;
    }

    // --- Table Headers ---
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'assets') {
      headers = ['Hostname', 'Category', 'Status', 'IP Address', 'Assigned To'];
      rows = sortedData.map(a => [a.hostname, toTitleCase(a.category || ''), toTitleCase(a.status), a.ipAddress || '-', a.assignedTo || 'Unassigned']);
    } else if (activeTab === 'tickets') {
      headers = ['Title', 'Asset', 'Status', 'Priority', 'Creator', 'Created At', 'Closed Time', 'Closed By'];
      rows = sortedData.map(t => [
        t.title, 
        t.assetName || 'Umum', 
        t.status, 
        t.priority, 
        t.creatorName || '-', 
        new Date(t.createdAt).toLocaleString(),
        t.status === 'Closed' ? (t.historyClosedAt ? new Date(t.historyClosedAt).toLocaleString() : new Date(t.updatedAt).toLocaleString()) : '-',
        t.status === 'Closed' ? (t.historyClosedBy || 'System User') : '-'
      ]);
    } else if (activeTab === 'consumables') {
      headers = ['Item Name', 'Category', 'Quantity', 'Min Alert', 'Location'];
      rows = sortedData.map(c => [c.name, c.category, c.quantity, c.minQuantity, c.location || '-']);
    }

    const headerRow = worksheet.getRow(6);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } }; // Gray
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // --- Data Rows ---
    rows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);
      // Striped rows
      if (index % 2 === 1) {
        excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });

    // --- Auto-fit Columns & Borders ---
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell!({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber >= 6 && cell.value) { // Only calculate from headers downwards
          const columnLength = cell.value.toString().length;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        }
        // Add borders to table cells
        if (rowNumber >= 6) {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        }
      });
      column.width = maxLength + 2; // Add padding
    });
    
    // Freeze top rows
    worksheet.views = [{ state: 'frozen', ySplit: 6 }];

    // Export to Blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `ITAM_${toTitleCase(activeTab)}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Reports</h2>
            <p className={styles.subtitle}>Generate, filter, and export your inventory reports.</p>
          </div>
          <button onClick={handleExportExcel} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Export to Excel
          </button>
        </div>

        {/* Smart Filters Bar */}
        <div style={{ background: 'var(--bg-card)', padding: '1.2rem', borderRadius: '12px', border: 'var(--glass-border)', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             <input type="text" placeholder="Search anything in this report..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          
          {(activeTab === 'assets' || activeTab === 'consumables') && (
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '150px' }}>
              <option value="All">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {(activeTab === 'assets' || activeTab === 'tickets') && (
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '150px' }}>
              <option value="All">All Statuses</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {activeTab === 'tickets' && (
            <>
              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '150px' }}>
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} title="Start Date" />
                <span style={{ color: 'var(--text-secondary)' }}>to</span>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} title="End Date" />
              </div>
            </>
          )}

          {activeTab === 'consumables' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <input type="checkbox" checked={lowStockOnly} onChange={e => { setLowStockOnly(e.target.checked); setCurrentPage(1); }} style={{ cursor: 'pointer' }} />
              Low Stock Only
            </label>
          )}
        </div>

        {/* Dynamic Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {activeTab === 'assets' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Filtered Assets</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{filteredData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active/In-Use</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{filteredData.filter(a => ['online', 'in-use'].includes(a.status)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Broken/Offline</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>{filteredData.filter(a => ['offline', 'broken'].includes(a.status)).length}</div>
              </div>
            </>
          )}
          
          {activeTab === 'tickets' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Filtered Tickets</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{filteredData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Open / In Progress</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>{filteredData.filter(t => ['Open', 'In Progress'].includes(t.status)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Resolved / Closed</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{filteredData.filter(t => ['Resolved', 'Closed'].includes(t.status)).length}</div>
              </div>
            </>
          )}

          {activeTab === 'consumables' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Filtered Items</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{filteredData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Items</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>{filteredData.filter(c => (Number(c.quantity) || 0) <= (Number(c.minQuantity) || 0)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Quantity (Units)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{filteredData.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0)}</div>
              </div>
            </>
          )}
        </div>

        {/* Data Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h3 style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>{activeTab} Table Preview</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  {activeTab === 'assets' && (
                    <>
                      <th onClick={() => requestSort('hostname')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Hostname {renderSortIndicator('hostname')}</th>
                      <th onClick={() => requestSort('category')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Category {renderSortIndicator('category')}</th>
                      <th onClick={() => requestSort('status')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Status {renderSortIndicator('status')}</th>
                      <th onClick={() => requestSort('ipAddress')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>IP Address {renderSortIndicator('ipAddress')}</th>
                      <th onClick={() => requestSort('assignedTo')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Assigned To {renderSortIndicator('assignedTo')}</th>
                    </>
                  )}
                  {activeTab === 'tickets' && (
                    <>
                      <th onClick={() => requestSort('title')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Title {renderSortIndicator('title')}</th>
                      <th onClick={() => requestSort('assetName')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Asset {renderSortIndicator('assetName')}</th>
                      <th onClick={() => requestSort('status')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Status {renderSortIndicator('status')}</th>
                      <th onClick={() => requestSort('priority')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Priority {renderSortIndicator('priority')}</th>
                      <th onClick={() => requestSort('creatorName')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Creator {renderSortIndicator('creatorName')}</th>
                    </>
                  )}
                  {activeTab === 'consumables' && (
                    <>
                      <th onClick={() => requestSort('name')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Item Name {renderSortIndicator('name')}</th>
                      <th onClick={() => requestSort('category')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Category {renderSortIndicator('category')}</th>
                      <th onClick={() => requestSort('quantity')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Quantity {renderSortIndicator('quantity')}</th>
                      <th onClick={() => requestSort('minQuantity')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Min Alert {renderSortIndicator('minQuantity')}</th>
                      <th onClick={() => requestSort('location')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Location {renderSortIndicator('location')}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found matching your filters.</td></tr>
                ) : (
                  sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      {activeTab === 'assets' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.hostname}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{toTitleCase(item.category || '-')}</td>
                          <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{toTitleCase(item.status)}</span></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.ipAddress || '-'}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.assignedTo || '-'}</td>
                        </>
                      )}
                      {activeTab === 'tickets' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.assetName || '-'}</td>
                          <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{item.status}</span></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.priority}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.creatorName || '-'}</td>
                        </>
                      )}
                      {activeTab === 'consumables' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: (item.quantity <= item.minQuantity) ? '#ef4444' : 'var(--text-primary)' }}>{item.quantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.minQuantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {sortedData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Showing {Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, sortedData.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} entries
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.5rem', fontWeight: 600 }}>{currentPage} / {Math.ceil(sortedData.length / ITEMS_PER_PAGE) || 1}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedData.length / ITEMS_PER_PAGE), p + 1))} 
                    disabled={currentPage >= Math.ceil(sortedData.length / ITEMS_PER_PAGE)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage >= Math.ceil(sortedData.length / ITEMS_PER_PAGE) ? 'transparent' : 'var(--bg-secondary)', color: currentPage >= Math.ceil(sortedData.length / ITEMS_PER_PAGE) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage >= Math.ceil(sortedData.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
