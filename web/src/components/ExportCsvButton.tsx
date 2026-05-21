'use client';
import React, { useState } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ExportCsvButton({ logs, monthYear }: { logs: any[], monthYear: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Audit Logs ${monthYear}`);

      // Style the header row
      sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Timestamp', key: 'timestamp', width: 22 },
        { header: 'Action', key: 'action', width: 15 },
        { header: 'Source', key: 'source', width: 25 },
        { header: 'Target Asset', key: 'target', width: 25 },
        { header: 'Changes Details', key: 'changes', width: 50 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Success Green color
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 30;

      // Add data
      logs.forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        let targetName = log.currentHostname || log.agentId;
        let changesText = '';
        
        try {
          const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
          targetName = changes?.hostname?.to || changes?.hostname || targetName;
          
          if (log.action === 'UPDATED' && changes) {
            changesText = Object.entries(changes)
              .map(([k, v]: [string, any]) => `${k}: ${v?.from ?? 'empty'} -> ${v?.to ?? 'empty'}`)
              .join('\n'); // newline for better readability in Excel
          }
        } catch (e) {}

        const row = sheet.addRow({
          id: log.id,
          timestamp: timestamp,
          action: log.action,
          source: log.source === 'AGENT_AUTO' ? 'Automated' : (log.source?.startsWith('MANUAL_WEB:') ? `Manual (${log.source.split(':')[1]})` : 'Manual'),
          target: targetName,
          changes: changesText
        });

        // Alternating row colors
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' } // very light gray
          };
        }

        // Add border and wrap text for the changes column
        ['id', 'timestamp', 'action', 'source', 'target', 'changes'].forEach(key => {
          const cell = row.getCell(key);
          cell.alignment = { vertical: 'top', wrapText: key === 'changes' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      // Generate the Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `ITAM_Logs_${monthYear.replace(' ', '_')}.xlsx`);
    } catch (error) {
      console.error('Failed to generate Excel:', error);
      alert('Failed to generate Excel file');
    }
    setIsExporting(false);
  };

  return (
    <button 
      onClick={downloadExcel}
      disabled={isExporting}
      style={{
        background: 'var(--accent-success)',
        color: 'white',
        border: 'none',
        padding: '0.6rem 1.2rem',
        borderRadius: '10px',
        cursor: isExporting ? 'wait' : 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s ease',
        opacity: isExporting ? 0.7 : 1
      }}
      onMouseOver={e => !isExporting && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={e => !isExporting && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
      {isExporting ? 'Generating...' : 'Export to Excel'}
    </button>
  );
}
