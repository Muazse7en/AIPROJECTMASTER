import { BOQItem } from '../types';
// This assumes xlsx is available globally from the script tag in index.html
declare const XLSX: any;

export const exportToExcel = (
    data: BOQItem[], 
    fileName: string,
    projectName: string,
    clientName: string
): void => {
  
  const header = [
    ['Project Name:', projectName],
    ['Client Name:', clientName],
    [], // Spacer row
    ['S.No.', 'Description of Work', 'Unit', 'Quantity', 'Manpower', 'Unit Price (QAR)', 'Total Amount (QAR)']
  ];

  const body = data.map((item, index) => ([
    index + 1,
    item.description,
    item.unit,
    item.quantity,
    item.manpower,
    item.unitPrice,
    item.total,
  ]));

  const worksheet = XLSX.utils.aoa_to_sheet([...header, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ');

  // Adjust column widths
  const columnWidths = [
    { wch: 15 }, // S.No. / Labels
    { wch: 60 }, // Description / Values
    { wch: 10 }, // Unit
    { wch: 10 }, // Quantity
    { wch: 25 }, // Manpower
    { wch: 15 }, // Unit Price
    { wch: 15 }, // Total Amount
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};