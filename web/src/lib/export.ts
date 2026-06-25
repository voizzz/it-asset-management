import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

export async function exportToExcel(filename: string, sheetName: string, columns: ColumnDef[], data: any[]) {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 20
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' } // Green header
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach((item, index) => {
      const row = sheet.addRow(item);
      // Optional: Alternating row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }
      row.alignment = { vertical: 'middle' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}
