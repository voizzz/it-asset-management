'use client';
import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 100 }}>
        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0', color: entry.color, fontWeight: 500 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: entry.color, display: 'inline-block' }}></span>
            {entry.name}: {entry.value}
          </div>
        ))}
        {data['Aset Rusak'] > 0 && data.brokenDetails && Object.keys(data.brokenDetails).length > 0 && (
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Rincian Aset Rusak:</div>
            {Object.entries(data.brokenDetails).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0' }}>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>- {cat}</span>
                <span style={{ fontWeight: 600, marginLeft: '1rem', color: 'var(--text-primary)' }}>{count as number}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [activeTab, setActiveTab] = useState('assets');
  const [assetReportView, setAssetReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [ticketReportView, setTicketReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [consumableReportView, setConsumableReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [softwareReportView, setSoftwareReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [licenseReportView, setLicenseReportView] = useState<'realtime' | 'yearly'>('realtime');
  
  const [reportData, setReportData] = useState<any[]>([]);
  const [yearlyTicketsData, setYearlyTicketsData] = useState<any[]>([]);
  const [yearlyChartGroupBy, setYearlyChartGroupBy] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [ticketYearlyChartGroupBy, setTicketYearlyChartGroupBy] = useState<'month' | 'year'>('month');
  const [ticketSelectedYear, setTicketSelectedYear] = useState<string>(new Date().getFullYear().toString());

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
      if (['assets', 'tickets', 'consumables', 'software', 'licenses'].includes(hash)) {
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
    if (activeTab === 'assets' && assetReportView === 'yearly') {
      fetch('/api/reports?type=tickets').then(r => r.json()).then(d => setYearlyTicketsData(d.data || []));
    }
  }, [activeTab, assetReportView]);

  const fetchReportData = async (tab: string) => {
    try {
      const res = await fetch(`/api/reports?type=${tab}`);
      const data = await res.json();
      setReportData(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const isWarrantyExpired = (a: any) => {
    if (!a.purchaseDate || !a.warrantyMonths) return false;
    const exp = new Date(a.purchaseDate);
    exp.setMonth(exp.getMonth() + parseInt(a.warrantyMonths));
    return exp.getTime() < Date.now();
  };

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    reportData.forEach(a => { if (a.createdAt) yearsSet.add(a.createdAt.substring(0, 4)); });
    let years = Array.from(yearsSet).sort().reverse();
    if (years.length === 0) years = [new Date().getFullYear().toString()];
    return years;
  }, [reportData]);

  // Helper to normalize strings for grouping
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const yearlyChartData = useMemo(() => {
    if (activeTab !== 'assets' || assetReportView !== 'yearly') return [];

    if (yearlyChartGroupBy === 'month') {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      return months.map(m => {
        const monthPrefix = `${selectedYear}-${m}`;
        const periodAssets = reportData.filter(a => a.createdAt && a.createdAt.startsWith(monthPrefix));
        
        const normalCount = periodAssets.filter(a => ['online', 'in-use'].includes(a.status)).length;
        const brokenAssets = periodAssets.filter(a => ['offline', 'broken'].includes(a.status));
        const brokenCount = brokenAssets.length;
        const expiredCount = periodAssets.filter(a => isWarrantyExpired(a)).length;

        const brokenByCategory: Record<string, number> = {};
        brokenAssets.forEach(a => {
           const cat = toTitleCase(a.category || 'Lainnya');
           brokenByCategory[cat] = (brokenByCategory[cat] || 0) + 1;
        });

        const monthName = new Date(`${selectedYear}-${m}-01`).toLocaleString('id-ID', { month: 'short' });

        return {
          name: monthName,
          'Total Aset': periodAssets.length,
          'Aset Normal': normalCount,
          'Aset Rusak': brokenCount,
          'Garansi Habis': expiredCount,
          brokenDetails: brokenByCategory,
        };
      });
    } else {
      let years = Array.from(availableYears).sort();
      return years.map(y => {
        const periodAssets = reportData.filter(a => a.createdAt && a.createdAt.startsWith(y));
        
        const normalCount = periodAssets.filter(a => ['online', 'in-use'].includes(a.status)).length;
        const brokenAssets = periodAssets.filter(a => ['offline', 'broken'].includes(a.status));
        const brokenCount = brokenAssets.length;
        const expiredCount = periodAssets.filter(a => isWarrantyExpired(a)).length;

        const brokenByCategory: Record<string, number> = {};
        brokenAssets.forEach(a => {
           const cat = toTitleCase(a.category || 'Lainnya');
           brokenByCategory[cat] = (brokenByCategory[cat] || 0) + 1;
        });

        return {
          name: y,
          'Total Aset': periodAssets.length,
          'Aset Normal': normalCount,
          'Aset Rusak': brokenCount,
          'Garansi Habis': expiredCount,
          brokenDetails: brokenByCategory,
        };
      });
    }
  }, [reportData, activeTab, assetReportView, yearlyChartGroupBy, selectedYear, availableYears]);

  const categoryChartData = useMemo(() => {
    if (activeTab !== 'assets' || assetReportView !== 'yearly') return [];
    const counts: Record<string, number> = {};
    reportData.forEach(item => {
      if (yearlyChartGroupBy === 'month' && item.createdAt && !item.createdAt.startsWith(selectedYear)) return;

      const cat = toTitleCase(item.category || 'Uncategorized');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportData, activeTab, assetReportView, yearlyChartGroupBy, selectedYear]);

  const yearlyMetrics = useMemo(() => {
    if (activeTab !== 'assets' || assetReportView !== 'yearly') return { healthScore: 0, normalCount: 0, attentionCount: 0, totalCount: 0, brokenCount: 0, expiredCount: 0 };
    
    const filteredAssets = reportData.filter(item => {
      if (yearlyChartGroupBy === 'month' && item.createdAt && !item.createdAt.startsWith(selectedYear)) return false;
      return true;
    });

    const totalCount = filteredAssets.length;
    const normalCount = filteredAssets.filter(a => ['online', 'in-use'].includes(a.status)).length;
    const brokenCount = filteredAssets.filter(a => ['offline', 'broken'].includes(a.status)).length;
    const expiredCount = filteredAssets.filter(a => isWarrantyExpired(a)).length;

    const healthScore = totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 0;
    
    return {
      healthScore,
      normalCount,
      totalCount,
      attentionCount: brokenCount + expiredCount,
      brokenCount,
      expiredCount
    };
  }, [reportData, activeTab, assetReportView, yearlyChartGroupBy, selectedYear]);

  // --- TICKET SUMMARY MEMOS ---
  const ticketAvailableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    reportData.forEach(t => { if (t.createdAt) yearsSet.add(t.createdAt.substring(0, 4)); });
    let years = Array.from(yearsSet).sort().reverse();
    if (years.length === 0) years = [new Date().getFullYear().toString()];
    return years;
  }, [reportData]);

  const ticketYearlyChartData = useMemo(() => {
    if (activeTab !== 'tickets' || ticketReportView !== 'yearly') return [];

    if (ticketYearlyChartGroupBy === 'month') {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      return months.map(m => {
        const monthPrefix = `${ticketSelectedYear}-${m}`;
        const periodTickets = reportData.filter(t => t.createdAt && t.createdAt.startsWith(monthPrefix));
        
        const openCount = periodTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
        const closedCount = periodTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;

        const monthName = new Date(`${ticketSelectedYear}-${m}-01`).toLocaleString('id-ID', { month: 'short' });

        return {
          name: monthName,
          'Total Tickets': periodTickets.length,
          'Resolved': closedCount,
          'Open': openCount,
        };
      });
    } else {
      let years = Array.from(ticketAvailableYears).sort();
      return years.map(y => {
        const periodTickets = reportData.filter(t => t.createdAt && t.createdAt.startsWith(y));
        
        const openCount = periodTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
        const closedCount = periodTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;

        return {
          name: y,
          'Total Tickets': periodTickets.length,
          'Resolved': closedCount,
          'Open': openCount,
        };
      });
    }
  }, [reportData, activeTab, ticketReportView, ticketYearlyChartGroupBy, ticketSelectedYear, ticketAvailableYears]);

  const ticketCategoryChartData = useMemo(() => {
    if (activeTab !== 'tickets' || ticketReportView !== 'yearly') return [];
    const counts: Record<string, number> = {};
    reportData.forEach(item => {
      if (ticketYearlyChartGroupBy === 'month' && item.createdAt && !item.createdAt.startsWith(ticketSelectedYear)) return;

      const cat = toTitleCase(item.category || 'Uncategorized');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportData, activeTab, ticketReportView, ticketYearlyChartGroupBy, ticketSelectedYear]);

  const ticketYearlyMetrics = useMemo(() => {
    if (activeTab !== 'tickets' || ticketReportView !== 'yearly') return { resolutionRate: 0, resolvedCount: 0, openCount: 0, totalCount: 0 };
    
    const filteredTickets = reportData.filter(item => {
      if (ticketYearlyChartGroupBy === 'month' && item.createdAt && !item.createdAt.startsWith(ticketSelectedYear)) return false;
      return true;
    });

    const totalCount = filteredTickets.length;
    const resolvedCount = filteredTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
    const openCount = filteredTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
    
    const resolutionRate = totalCount === 0 ? 0 : Math.round((resolvedCount / totalCount) * 100);

    return { resolutionRate, resolvedCount, openCount, totalCount };
  }, [reportData, activeTab, ticketReportView, ticketYearlyChartGroupBy, ticketSelectedYear]);

  // --- CONSUMABLES SUMMARY MEMOS ---
  const consumableCategoryChartData = useMemo(() => {
    if (activeTab !== 'consumables' || consumableReportView !== 'yearly') return [];
    const counts: Record<string, number> = {};
    reportData.forEach(item => {
      const cat = toTitleCase(item.category || 'Uncategorized');
      counts[cat] = (counts[cat] || 0) + (Number(item.quantity) || 0); 
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportData, activeTab, consumableReportView]);

  const consumableInventoryChartData = useMemo(() => {
    if (activeTab !== 'consumables' || consumableReportView !== 'yearly') return [];
    return reportData
      .map(item => ({
        name: item.name,
        'Quantity': Number(item.quantity) || 0,
        'Min Quantity': Number(item.minQuantity) || 0,
        deficit: (Number(item.quantity) || 0) - (Number(item.minQuantity) || 0),
        unit: item.unit || 'pcs'
      }))
      .sort((a, b) => a.deficit - b.deficit)
      .slice(0, 15);
  }, [reportData, activeTab, consumableReportView]);


  // --- SOFTWARE SUMMARY LOGIC ---
  const dangerousKeywords = ['torrent', 'crack', 'keygen', 'kmsauto', 'patcher', 'nmap', 'wireshark', 'metasploit', 'cheat', 'miner', 'nicehash', 'hack'];
  
  const dangerousSoftware = useMemo(() => {
    if (activeTab !== 'software') return [];
    return reportData.filter((s: any) => {
       const nameLower = (s.name || '').toLowerCase();
       return dangerousKeywords.some(kw => nameLower.includes(kw));
    }).map((s: any) => ({
       ...s,
       riskLevel: 'High Risk'
    }));
  }, [reportData, activeTab]);

  const softwareMetrics = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return { totalTitles: 0, totalInstalls: 0, dangerousCount: 0 };
    const totalTitles = reportData.length;
    const totalInstalls = reportData.reduce((acc, s: any) => acc + (Number(s.installCount) || 0), 0);
    return { totalTitles, totalInstalls, dangerousCount: dangerousSoftware.length };
  }, [reportData, activeTab, softwareReportView, dangerousSoftware]);

  const softwareChartData = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return [];
    return [...reportData]
      .sort((a: any, b: any) => (Number(b.installCount) || 0) - (Number(a.installCount) || 0))
      .slice(0, 15)
      .map((s: any) => ({
        name: s.name,
        Installations: Number(s.installCount) || 0
      }));
  }, [reportData, activeTab, softwareReportView]);

  // --- LICENSE SUMMARY LOGIC ---
  const licenseMetrics = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return { totalLicenses: 0, totalSeats: 0, usedSeats: 0, expiredCount: 0 };
    const totalLicenses = reportData.length;
    const totalSeats = reportData.reduce((acc, l: any) => acc + (Number(l.totalSeats) || 0), 0);
    const usedSeats = reportData.reduce((acc, l: any) => acc + (Number(l.usedSeats) || 0), 0);
    const expiredCount = reportData.filter((l: any) => l.expiryDate && new Date(l.expiryDate) < new Date()).length;
    return { totalLicenses, totalSeats, usedSeats, expiredCount };
  }, [reportData, activeTab, licenseReportView]);

  const licenseChartData = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return [];
    return reportData.map((l: any) => ({
      name: l.softwareName,
      'Total Seats': Number(l.totalSeats) || 0,
      'Used Seats': Number(l.usedSeats) || 0
    }));
  }, [reportData, activeTab, licenseReportView]);

  const consumableMetrics = useMemo(() => {
    if (activeTab !== 'consumables' || consumableReportView !== 'yearly') return { totalItems: 0, totalQuantity: 0, lowStockCount: 0 };
    
    const totalItems = reportData.length;
    let totalQuantity = 0;
    let lowStockCount = 0;
    reportData.forEach(item => {
      const q = Number(item.quantity) || 0;
      const min = Number(item.minQuantity) || 0;
      totalQuantity += q;
      if (q <= min) lowStockCount++;
    });

    return { totalItems, totalQuantity, lowStockCount };
  }, [reportData, activeTab, consumableReportView]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#ef4444', '#14b8a6', '#f43f5e'];

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
    
    const reportTitle = activeTab === 'assets' 
      ? (assetReportView === 'realtime' ? 'Assets Reguler Report' : 'Assets Summary Report')
      : activeTab === 'tickets' ? (ticketReportView === 'realtime' ? 'Tickets Reguler Report' : 'Tickets Summary Report')
      : activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Consumables Reguler Report' : 'Consumables Summary Report')
      : activeTab === 'software' ? (softwareReportView === 'realtime' ? 'Software Reguler Report' : 'Software Summary Report')
      : activeTab === 'licenses' ? (licenseReportView === 'realtime' ? 'Licenses Reguler Report' : 'Licenses Summary Report')
      : `${toTitleCase(activeTab)} Inventory Report`;
      
    const sheetName = activeTab === 'assets' 
      ? (assetReportView === 'realtime' ? 'Assets_Reguler' : 'Assets_Summary')
      : activeTab === 'tickets' ? (ticketReportView === 'realtime' ? 'Tickets_Reguler' : 'Tickets_Summary')
      : activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Consumables_Reguler' : 'Consumables_Summary')
      : activeTab === 'software' ? (softwareReportView === 'realtime' ? 'Software_Reguler' : 'Software_Summary')
      : activeTab === 'licenses' ? (licenseReportView === 'realtime' ? 'Licenses_Reguler' : 'Licenses_Summary')
      : toTitleCase(activeTab);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // --- Corporate Header ---
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${logoName} - ${reportTitle}`;
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
      if (assetReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Health Score:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = `${yearlyMetrics.healthScore}%`;
        worksheet.getCell('E4').value = 'Needs Attention:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = yearlyMetrics.attentionCount;
      } else {
        worksheet.getCell('C4').value = 'Active/In-Use:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = filteredData.filter(a => ['online', 'in-use'].includes(a.status)).length;
      }
    } else if (activeTab === 'tickets') {
      if (ticketReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Resolution Rate:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = `${ticketYearlyMetrics.resolutionRate}%`;
        worksheet.getCell('E4').value = 'Open Tickets:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = ticketYearlyMetrics.openCount;
      } else {
        worksheet.getCell('C4').value = 'Open/In Progress:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = filteredData.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
      }
    } else if (activeTab === 'software') {
      if (softwareReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Total Titles:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = softwareMetrics.totalTitles;
        worksheet.getCell('E4').value = 'Total Installations:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = softwareMetrics.totalInstalls;
      }
    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Total Seats:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = licenseMetrics.totalSeats;
        worksheet.getCell('E4').value = 'Used Seats:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = licenseMetrics.usedSeats;
      }
    } else if (activeTab === 'consumables') {
      if (consumableReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Total Quantity:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = consumableMetrics.totalQuantity;
        worksheet.getCell('E4').value = 'Low Stock Items:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = consumableMetrics.lowStockCount;
      } else {
        worksheet.getCell('C4').value = 'Low Stock:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = filteredData.filter(c => (Number(c.quantity) || 0) <= (Number(c.minQuantity) || 0)).length;
      }
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'assets') {
      if (assetReportView === 'yearly') {
        headers = ['Period', 'Total Asset', 'Aset Normal', 'Aset Rusak', 'Garansi Habis'];
        yearlyChartData.forEach(item => {
           rows.push([item.name, item['Total Aset'] || 0, item['Aset Normal'] || 0, item['Aset Rusak'] || 0, item['Garansi Habis'] || 0]);
        });
        
        rows.push([]);
        rows.push(['--- ASSET DISTRIBUTION BY CATEGORY ---', '', '', '', '']);
        rows.push(['Category', 'Total Assets', '', '', '']);
        
        categoryChartData.forEach(cat => {
           rows.push([cat.name, cat.value, '', '', '']);
        });
      } else {
        headers = ['Hostname', 'Category', 'Status', 'IP Address', 'Assigned To'];
        rows = sortedData.map(a => [a.hostname, toTitleCase(a.category || ''), toTitleCase(a.status), a.ipAddress || '-', a.assignedTo || 'Unassigned']);
      }
    } else if (activeTab === 'tickets') {
      if (ticketReportView === 'yearly') {
        headers = ['Period', 'Total Tickets', 'Resolved', 'Open'];
        ticketYearlyChartData.forEach(item => {
           rows.push([item.name, item['Total Tickets'] || 0, item['Resolved'] || 0, item['Open'] || 0]);
        });
        
        rows.push([]);
        rows.push(['--- TICKET DISTRIBUTION BY CATEGORY ---', '', '', '']);
        rows.push(['Category', 'Total Tickets', '', '']);
        
        ticketCategoryChartData.forEach(cat => {
           rows.push([cat.name, cat.value, '', '']);
        });
      } else {
        headers = ['Title', 'Asset', 'Status', 'Priority', 'Creator', 'Created At', 'Closed Time', 'Closed By'];
        rows = sortedData.map(t => [
          t.title, 
          t.assetName || 'Umum', 
          t.status, 
          t.priority, 
          t.creatorName || '-', 
          new Date(t.createdAt).toLocaleString(),
          ['Resolved', 'Closed'].includes(t.status) ? (t.historyClosedAt ? new Date(t.historyClosedAt).toLocaleString() : new Date(t.updatedAt).toLocaleString()) : '-',
          ['Resolved', 'Closed'].includes(t.status) ? (t.historyClosedBy || 'System User') : '-'
        ]);
      }
    } else if (activeTab === 'software') {
      if (softwareReportView === 'yearly') {
        headers = ['Software Name', 'Installations'];
        softwareChartData.forEach(item => {
           rows.push([item.name, item.Installations]);
        });

        if (dangerousSoftware.length > 0) {
          rows.push([]);
          rows.push(['--- HIGH RISK SOFTWARE DETECTED ---', '', '']);
          rows.push(['Software Name', 'Installations', 'Installed On']);
          dangerousSoftware.forEach((item: any) => {
             rows.push([item.name, item.installCount, item.installedAssets || '-']);
          });
        }
      } else {
        headers = ['Software Name', 'Version', 'Publisher', 'Installations'];
        rows = sortedData.map(s => [s.name, s.version, s.publisher, s.installCount]);
      }
    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        headers = ['Software Name', 'Total Seats', 'Used Seats', 'Available'];
        licenseChartData.forEach(item => {
           rows.push([item.name, item['Total Seats'], item['Used Seats'], item['Total Seats'] - item['Used Seats']]);
        });
      } else {
        headers = ['Software Name', 'License Key', 'Expiry Date', 'Status', 'Total Seats', 'Used Seats', 'Available'];
        rows = sortedData.map(l => [
          l.softwareName, 
          l.licenseKey || '-', 
          l.expiryDate || '-', 
          (l.expiryDate && new Date(l.expiryDate) < new Date()) ? 'Expired' : 'Active',
          l.totalSeats, 
          l.usedSeats, 
          l.totalSeats - l.usedSeats
        ]);
      }
    } else if (activeTab === 'consumables') {
      if (consumableReportView === 'yearly') {
        headers = ['Item Name', 'Quantity', 'Min Alert', 'Deficit'];
        consumableInventoryChartData.forEach(item => {
           rows.push([item.name, (item['Quantity'] || 0) + ' ' + (item.unit || 'pcs'), (item['Min Quantity'] || 0) + ' ' + (item.unit || 'pcs'), item.deficit || 0]);
        });
        
        rows.push([]);
        rows.push(['--- CONSUMABLES DISTRIBUTION BY CATEGORY ---', '', '', '']);
        rows.push(['Category', 'Total Quantity', '', '']);
        
        consumableCategoryChartData.forEach(cat => {
           rows.push([cat.name, cat.value, '', '']);
        });
      } else {
        headers = ['Item Name', 'Category', 'Quantity', 'Min Alert', 'Location'];
        rows = sortedData.map(c => [c.name, c.category, c.quantity + ' ' + (c.unit || 'pcs'), c.minQuantity + ' ' + (c.unit || 'pcs'), c.location || '-']);
      }
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
    saveAs(blob, `ITAM_${sheetName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
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

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '10px', width: 'fit-content' }}>
          <style>{`
            .sub-tab-btn {
              padding: 0.6rem 1.2rem;
              border-radius: 8px;
              border: none;
              background: transparent;
              color: var(--text-secondary);
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .sub-tab-btn:hover {
              background: rgba(100,100,100,0.1);
              color: var(--text-primary);
            }
            .sub-tab-btn.active {
              background: var(--accent-primary) !important;
              color: #ffffff !important;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
          `}</style>

          {activeTab === 'assets' && (
            <>
              <button 
                onClick={() => setAssetReportView('realtime')}
                className={`sub-tab-btn ${assetReportView === 'realtime' ? 'active' : ''}`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setAssetReportView('yearly')}
                className={`sub-tab-btn ${assetReportView === 'yearly' ? 'active' : ''}`}
              >
                Summary Report
              </button>
            </>
          )}

          {activeTab === 'tickets' && (
            <>
              <button 
                onClick={() => setTicketReportView('realtime')}
                className={`sub-tab-btn ${ticketReportView === 'realtime' ? 'active' : ''}`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setTicketReportView('yearly')}
                className={`sub-tab-btn ${ticketReportView === 'yearly' ? 'active' : ''}`}
              >
                Summary Report
              </button>
            </>
          )}

          {activeTab === 'consumables' && (
            <>
              <button 
                onClick={() => setConsumableReportView('realtime')}
                className={`sub-tab-btn ${consumableReportView === 'realtime' ? 'active' : ''}`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setConsumableReportView('yearly')}
                className={`sub-tab-btn ${consumableReportView === 'yearly' ? 'active' : ''}`}
              >
                Summary Report
              </button>
            </>
          )}
          {activeTab === 'software' && (
            <>
              <button 
                onClick={() => setSoftwareReportView('realtime')}
                className={`sub-tab-btn ${softwareReportView === 'realtime' ? 'active' : ''}`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setSoftwareReportView('yearly')}
                className={`sub-tab-btn ${softwareReportView === 'yearly' ? 'active' : ''}`}
              >
                Summary Report
              </button>
            </>
          )}

          {activeTab === 'licenses' && (
            <>
              <button 
                onClick={() => setLicenseReportView('realtime')}
                className={`sub-tab-btn ${licenseReportView === 'realtime' ? 'active' : ''}`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setLicenseReportView('yearly')}
                className={`sub-tab-btn ${licenseReportView === 'yearly' ? 'active' : ''}`}
              >
                Summary Report
              </button>
            </>
          )}

        </div>

        {/* Smart Filters Bar */}
        {((activeTab === 'assets' && assetReportView === 'realtime') ||
          (activeTab === 'tickets' && ticketReportView === 'realtime') ||
          (activeTab === 'consumables' && consumableReportView === 'realtime') ||
          (activeTab === 'software' && softwareReportView === 'realtime') ||
          (activeTab === 'licenses' && licenseReportView === 'realtime')) && (
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
          )}

        {activeTab === 'assets' && assetReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: '1 1 350px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Total Asset per Category</h3>
                <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={true}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '2 1 400px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: yearlyMetrics.healthScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Tingkat Kesehatan Aset</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: yearlyMetrics.healthScore >= 80 ? 'var(--accent-success)' : yearlyMetrics.healthScore >= 50 ? '#f59e0b' : '#ef4444', letterSpacing: '-2px' }}>
                       {yearlyMetrics.healthScore}%
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Optimal</span>
                   </div>
                   <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem', zIndex: 1 }}>
                     <div style={{ width: `${yearlyMetrics.healthScore}%`, height: '100%', background: yearlyMetrics.healthScore >= 80 ? 'var(--accent-success)' : yearlyMetrics.healthScore >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 1s ease-in-out' }} />
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1 }}>
                     <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{yearlyMetrics.normalCount}</span> dari {yearlyMetrics.totalCount} aset beroperasi normal
                   </div>
                 </div>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: yearlyMetrics.attentionCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Perlu Perhatian Segera</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: yearlyMetrics.attentionCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {yearlyMetrics.attentionCount}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unit Asset</span>
                   </div>
                   <div style={{ display: 'flex', gap: '0.75rem', zIndex: 1, flexWrap: 'wrap' }}>
                     <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                       <span style={{ color: '#ef4444', fontWeight: 700, marginRight: '0.4rem' }}>{yearlyMetrics.brokenCount}</span>
                       <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Rusak</span>
                     </div>
                     <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                       <span style={{ color: '#f59e0b', fontWeight: 700, marginRight: '0.4rem' }}>{yearlyMetrics.expiredCount}</span>
                       <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Garansi Habis</span>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Asset Summary Report</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={yearlyChartGroupBy} 
                    onChange={e => setYearlyChartGroupBy(e.target.value as 'month' | 'year')}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                  >
                    <option value="month">Per Bulan</option>
                    <option value="year">Per Tahun (Semua)</option>
                  </select>
                  
                  {yearlyChartGroupBy === 'month' && (
                    <select 
                      value={selectedYear} 
                      onChange={e => setSelectedYear(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                    >
                      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Total Aset" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Aset Normal" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Aset Rusak" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Garansi Habis" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TICKET SUMMARY */}
        {activeTab === 'tickets' && ticketReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: '1 1 350px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Total Tickets per Category</h3>
                <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketCategoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={true}
                      >
                        {ticketCategoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '2 1 400px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: ticketYearlyMetrics.resolutionRate >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Resolution Rate</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: ticketYearlyMetrics.resolutionRate >= 75 ? 'var(--accent-success)' : ticketYearlyMetrics.resolutionRate >= 50 ? '#f59e0b' : '#ef4444', letterSpacing: '-2px' }}>
                       {ticketYearlyMetrics.resolutionRate}%
                     </span>
                   </div>
                   <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem', zIndex: 1 }}>
                     <div style={{ width: `${ticketYearlyMetrics.resolutionRate}%`, height: '100%', background: ticketYearlyMetrics.resolutionRate >= 75 ? 'var(--accent-success)' : ticketYearlyMetrics.resolutionRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 1s ease-in-out' }} />
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1 }}>
                     <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{ticketYearlyMetrics.resolvedCount}</span> dari {ticketYearlyMetrics.totalCount} tiket berhasil diselesaikan
                   </div>
                 </div>
                 
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: ticketYearlyMetrics.openCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Open Tickets</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: ticketYearlyMetrics.openCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {ticketYearlyMetrics.openCount}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiket Aktif</span>
                   </div>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Ticket Summary Report</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={ticketYearlyChartGroupBy} 
                    onChange={e => setTicketYearlyChartGroupBy(e.target.value as 'year' | 'month')}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                  >
                    <option value="month">Per Bulan</option>
                    <option value="year">Per Tahun (Semua)</option>
                  </select>
                  
                  {ticketYearlyChartGroupBy === 'month' && (
                    <select 
                      value={ticketSelectedYear} 
                      onChange={e => setTicketSelectedYear(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                    >
                      {ticketAvailableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ticketYearlyChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Total Tickets" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Resolved" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Open" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* CONSUMABLE SUMMARY */}
        {activeTab === 'consumables' && consumableReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: '1 1 350px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Total Quantity per Category</h3>
                <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consumableCategoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={true}
                      >
                        {consumableCategoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '2 1 400px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Quantity</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {consumableMetrics.totalQuantity}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Items</span>
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1 }}>
                     Spread across <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{consumableMetrics.totalItems}</span> unique types
                   </div>
                 </div>
                 
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: consumableMetrics.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Low Stock Alerts</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: consumableMetrics.lowStockCount > 0 ? '#f59e0b' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {consumableMetrics.lowStockCount}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Types</span>
                   </div>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Consumable Inventory Deficit (Top 15)</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consumableInventoryChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Quantity" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Min Quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SOFTWARE SUMMARY */}
        {activeTab === 'software' && softwareReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Software Titles</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalTitles}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Installations</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalInstalls}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: softwareMetrics.dangerousCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.05)', animation: softwareMetrics.dangerousCount > 0 ? 'pulse 2s infinite' : 'none' }} />
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Threats Detected</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: softwareMetrics.dangerousCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {softwareMetrics.dangerousCount}
                   </span>
                 </div>
              </div>
            </div>


            {dangerousSoftware.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 4px 20px rgba(239,68,68,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    High Risk Software Detected
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Software Name</th>
                        <th style={{ padding: '1rem' }}>Publisher</th>
                        <th style={{ padding: '1rem' }}>Installations</th>
                        <th style={{ padding: '1rem' }}>Installed On</th>
                        <th style={{ padding: '1rem' }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dangerousSoftware.map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.1)', background: 'rgba(239, 68, 68, 0.02)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600, color: '#ef4444' }}>{item.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.publisher || '-'}</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{item.installCount || 0}</td>
                          <td style={{ padding: '1rem' }}>
                            {item.installedAssets ? item.installedAssets.split(',').map((asset: string, idx: number) => (
                               <span key={idx} style={{ display: 'inline-block', margin: '2px', padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', fontSize: '0.8rem', color: '#ef4444' }}>{asset.trim()}</span>
                            )) : '-'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                              {item.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Top 15 Most Installed Software</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={softwareChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Installations" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* LICENSES SUMMARY */}
        {activeTab === 'licenses' && licenseReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalLicenses}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Expired Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: licenseMetrics.expiredCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.expiredCount}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Seats Available</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalSeats}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Used Seats</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: '#f59e0b', letterSpacing: '-2px' }}>
                     {licenseMetrics.usedSeats}
                   </span>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>License Utilization</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={licenseChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Total Seats" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Used Seats" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {((activeTab === 'assets' && assetReportView === 'realtime') ||
          (activeTab === 'tickets' && ticketReportView === 'realtime') ||
          (activeTab === 'consumables' && consumableReportView === 'realtime') ||
          (activeTab === 'software' && softwareReportView === 'realtime') ||
          (activeTab === 'licenses' && licenseReportView === 'realtime')) && (
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
                  {activeTab === 'software' && (
                    <>
                      <th onClick={() => requestSort('name')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Software Name {renderSortIndicator('name')}</th>
                      <th onClick={() => requestSort('version')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Version {renderSortIndicator('version')}</th>
                      <th onClick={() => requestSort('publisher')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Publisher {renderSortIndicator('publisher')}</th>
                      <th onClick={() => requestSort('installCount')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Installations {renderSortIndicator('installCount')}</th>
                    </>
                  )}
                  {activeTab === 'licenses' && (
                    <>
                      <th onClick={() => requestSort('softwareName')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Software Name {renderSortIndicator('softwareName')}</th>
                      <th onClick={() => requestSort('licenseKey')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>License Key {renderSortIndicator('licenseKey')}</th>
                      <th onClick={() => requestSort('expiryDate')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Expiry Date {renderSortIndicator('expiryDate')}</th>
                      <th style={{ padding: '1rem', userSelect: 'none' }}>Status</th>
                      <th onClick={() => requestSort('totalSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Total Seats {renderSortIndicator('totalSeats')}</th>
                      <th onClick={() => requestSort('usedSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Used Seats {renderSortIndicator('usedSeats')}</th>
                      <th style={{ padding: '1rem', userSelect: 'none' }}>Available</th>
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
                          <td style={{ padding: '1rem', fontWeight: 700, color: (item.quantity <= item.minQuantity) ? '#ef4444' : 'var(--text-primary)' }}>{item.quantity} {item.unit || 'pcs'}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.minQuantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        </>
                      )}
                      {activeTab === 'software' && (
                        <>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.name}</div></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.version}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.publisher}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--bg-secondary)', fontWeight: 600 }}>
                              {item.installCount || 0}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'licenses' && (
                        <>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.softwareName}</div></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.licenseKey ? `••••${item.licenseKey.slice(-4)}` : '-'}</td>
                          <td style={{ padding: '1rem' }}>
                            {item.expiryDate ? (
                              <span style={{ fontWeight: 500 }}>
                                {item.expiryDate}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {item.expiryDate && new Date(item.expiryDate) < new Date() ? (
                               <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>Expired</span>
                            ) : (
                               <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)', fontWeight: 600, fontSize: '0.85rem' }}>Active</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.totalSeats}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ color: item.usedSeats > item.totalSeats ? '#ef4444' : 'var(--text-primary)', fontWeight: item.usedSeats > item.totalSeats ? 800 : 600 }}>
                              {item.usedSeats || 0}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: ((item.totalSeats || 0) - (item.usedSeats || 0)) < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: ((item.totalSeats || 0) - (item.usedSeats || 0)) < 0 ? '#ef4444' : 'var(--accent-success)', fontWeight: 600 }}>
                              {(item.totalSeats || 0) - (item.usedSeats || 0)}
                            </span>
                          </td>
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
        )}
      </section>
    </div>
  );
}
