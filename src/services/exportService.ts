import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { Order, Product } from '../types';

// Khởi tạo jsPDF với font Helvetica hỗ trợ Unicode tốt hơn
const initPDF = async () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });

  // Sử dụng font Helvetica (hỗ trợ Unicode tốt hơn Times)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  doc.setProperties({
    title: 'Hóa đơn Oanh Cua',
    subject: 'Hóa đơn bán hàng',
    author: 'Oanh Cua Co., Ltd',
    creator: 'Oanh Cua Web App',
  });

  return doc;
};

// In hóa đơn trực tiếp từ HTML (không cần PDF) với responsive cho nhiều kích thước giấy
export const printInvoice = async (order: Order, products: Product[], paperSize: string = 'A4') => {
  try {
    // Tạo mã QR TikTok
    const tiktokUrl = 'https://www.tiktok.com/@oanhcua98';
    const qrCodeDataUrl = await QRCode.toDataURL(tiktokUrl, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Tạo HTML cho hóa đơn với CSS responsive
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn #${order.id}</title>
    <style>
        /* CSS cơ bản */
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
            font-size: 12px;
        }
        
        /* Header responsive */
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .company-logo {
            width: 60px;
            height: 45px;
            margin: 0 auto 8px;
        }
        
        .company-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin: 4px 0;
        }
        
        .company-desc {
            font-size: 10px;
            color: #666;
            margin: 3px 0;
        }
        
        .contact-info {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
        }
        
        /* Thông tin đơn hàng responsive */
        .order-info {
            margin: 15px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        
        .order-detail {
            font-size: 11px;
            margin: 3px 0;
        }
        
        /* Bảng sản phẩm responsive */
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }
        
        .products-table th,
        .products-table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            text-align: left;
        }
        
        .products-table th {
            background-color: #4285F4;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
        }
        
        .products-table td:nth-child(2) {
            text-align: center;
        }
        
        .products-table td:nth-child(3),
        .products-table td:nth-child(4) {
            text-align: right;
        }
        
        /* Tổng tiền */
        .total {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
        }
        
        /* QR Code */
        .qr-section {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 15px;
        }
        
        .qr-code {
            text-align: center;
        }
        
        .qr-code img {
            width: 50px;
            height: 50px;
        }
        
        .qr-text {
            font-size: 8px;
            margin-top: 3px;
        }
        
        /* Media queries cho các kích thước giấy khác nhau */
        
        /* A4 Portrait (mặc định) */
        @media print and (size: A4 portrait) {
            body {
                padding: 15px;
                font-size: 11px;
            }
            
            .invoice-title { font-size: 20px; }
            .company-name { font-size: 15px; }
            .products-table { font-size: 10px; }
            .total { font-size: 15px; }
        }
        
        /* A4 Landscape */
        @media print and (size: A4 landscape) {
            body {
                padding: 20px;
                font-size: 12px;
            }
            
            .order-info {
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
            }
            
            .products-table {
                margin: 20px 0;
                font-size: 11px;
            }
            
            .products-table th,
            .products-table td {
                padding: 6px 8px;
            }
        }
        
        /* Letter Portrait (8.5" x 11") */
        @media print and (size: letter portrait) {
            body {
                padding: 18px;
                font-size: 11px;
            }
            
            .invoice-title { font-size: 19px; }
            .company-name { font-size: 14px; }
        }
        
        /* Letter Landscape */
        @media print and (size: letter landscape) {
            body {
                padding: 22px;
                font-size: 12px;
            }
            
            .order-info {
                grid-template-columns: 1fr 1fr 1fr;
            }
        }
        
        /* Legal (8.5" x 14") */
        @media print and (size: legal) {
            body {
                padding: 25px;
                font-size: 12px;
            }
            
            .invoice-title { font-size: 22px; }
            .company-name { font-size: 16px; }
        }
        
        /* A5 Portrait */
        @media print and (size: A5 portrait) {
            body {
                padding: 12px;
                font-size: 9px;
            }
            
            .invoice-title { font-size: 16px; }
            .company-name { font-size: 12px; }
            .company-desc { font-size: 8px; }
            .contact-info { font-size: 7px; }
            .order-detail { font-size: 9px; }
            .products-table { font-size: 8px; }
            .products-table th,
            .products-table td { padding: 3px 4px; }
            .total { font-size: 12px; }
            .footer { font-size: 8px; }
            .qr-code img { width: 40px; height: 40px; }
            .qr-text { font-size: 7px; }
        }
        
        /* A5 Landscape */
        @media print and (size: A5 landscape) {
            body {
                padding: 15px;
                font-size: 10px;
            }
            
            .order-info {
                grid-template-columns: 1fr 1fr 1fr;
            }
        }
        
        /* A6 (Postcard size) */
        @media print and (size: A6) {
            body {
                padding: 8px;
                font-size: 7px;
            }
            
            .invoice-title { font-size: 12px; }
            .company-name { font-size: 9px; }
            .company-desc { font-size: 6px; }
            .contact-info { font-size: 5px; }
            .order-detail { font-size: 7px; }
            .products-table { font-size: 6px; }
            .products-table th,
            .products-table td { padding: 2px 3px; }
            .total { font-size: 9px; }
            .footer { font-size: 6px; }
            .qr-code img { width: 30px; height: 30px; }
            .qr-text { font-size: 5px; }
        }
        
        /* Custom size cho máy in nhiệt (80mm) */
        @media print and (size: 80mm) {
            body {
                padding: 5px;
                font-size: 8px;
                max-width: 80mm;
            }
            
            .invoice-title { font-size: 14px; }
            .company-name { font-size: 10px; }
            .company-desc { font-size: 7px; }
            .contact-info { font-size: 6px; }
            .order-detail { font-size: 8px; }
            .products-table { font-size: 7px; }
            .products-table th,
            .products-table td { padding: 2px 3px; }
            .total { font-size: 11px; }
            .footer { font-size: 7px; }
            .qr-code img { width: 35px; height: 35px; }
            .qr-text { font-size: 6px; }
        }
        
        /* Responsive cho màn hình nhỏ */
        @media screen and (max-width: 768px) {
            body {
                padding: 15px;
                font-size: 14px;
            }
            
            .order-info {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .products-table {
                font-size: 12px;
            }
            
            .products-table th,
            .products-table td {
                padding: 6px 8px;
            }
        }
        
        /* Print styles */
        @media print {
            body { 
                margin: 0; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .no-print { display: none; }
            
            /* Đảm bảo không bị cắt trang */
            .header, .order-info, .products-table, .total, .footer {
                page-break-inside: avoid;
            }
            
            /* Tự động điều chỉnh font size nếu cần */
            @page {
                size: auto;
                margin: 10mm;
            }
        }
    </style>
</head>
<body class="paper-${paperSize.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
    <div class="header">
        <div class="company-logo">
            <img src="${window.location.origin}/images/logo.jpeg" 
                 alt="Logo Oanh Cua" 
                 style="width: 60px; height: 45px; object-fit: contain;"
                 onerror="this.style.display='none'">
        </div>
        <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
        <div class="company-name">CÔNG TY TNHH OANH CUA</div>
        <div class="company-desc">Chuyên cung cấp cua biển chất lượng cao</div>
        <div class="contact-info">Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</div>
        <div class="contact-info">Điện thoại: 0123.456.789 | Email: info@oanhcua.vn</div>
    </div>

    <div class="order-info">
        <div>
            <div class="order-detail"><strong>Mã đơn hàng:</strong> #${order.id}</div>
            <div class="order-detail"><strong>Khách hàng:</strong> ${order.customerName || 'N/A'}</div>
            ${order.customerPhone ? `<div class="order-detail"><strong>Số điện thoại:</strong> ${order.customerPhone}</div>` : ''}
        </div>
        <div>
            <div class="order-detail"><strong>Ngày:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
            <div class="order-detail"><strong>Phương thức:</strong> ${getPaymentMethodLabel(order.paymentMethod)}</div>
            ${order.customerAddress ? `<div class="order-detail"><strong>Địa chỉ:</strong> ${order.customerAddress}</div>` : ''}
        </div>
    </div>

    <table class="products-table">
        <thead>
            <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            ${(order.items || []).map(item => {
              const product = products.find(p => p.id === item.productId);
              const productName = product ? product.name : 'Không xác định';
              const total = (item.unitPrice || 0) * (item.quantity || 0);
              
              return `
                <tr>
                    <td>${productName}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${formatCurrency(item.unitPrice || 0)}</td>
                    <td>${formatCurrency(total)}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>

    <div class="total">
        <strong>Tổng cộng: ${formatCurrency(order.totalAmount || 0)}</strong>
    </div>

    <div class="footer">
        <div>Cảm ơn quý khách đã mua hàng!</div>
        <div style="margin: 10px 0;"><strong>OANH CUA - Cua biển tươi ngon chất lượng cao</strong></div>
        <div>Hotline: 0123.456.789 | Website: oanhcua.vn</div>
    </div>

    <div class="qr-section">
        <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR TikTok">
            <div class="qr-text">TikTok<br>@oanhcua98</div>
        </div>
    </div>

    <script>
        // Tự động in khi trang load xong
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.close();
            }, 500);
        }
    </script>
</body>
</html>`;

    // Mở cửa sổ mới và in
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    } else {
      alert('Vui lòng cho phép popup để in hóa đơn');
    }

  } catch (error) {
    console.error('Lỗi khi in hóa đơn:', error);
    alert('Có lỗi xảy ra khi in hóa đơn. Vui lòng thử lại.');
  }
};

// Function helper để in hóa đơn với kích thước giấy được chọn
export const printInvoiceWithSize = async (order: Order, products: Product[]) => {
  // Danh sách kích thước giấy hỗ trợ
  const paperSizes = [
    { value: 'A4', label: 'A4 (21cm x 29.7cm) - Khổ giấy chuẩn' },
    { value: 'A4-L', label: 'A4 Landscape (29.7cm x 21cm) - Khổ ngang' },
    { value: 'A5', label: 'A5 (14.8cm x 21cm) - Khổ nhỏ' },
    { value: 'A5-L', label: 'A5 Landscape (21cm x 14.8cm) - Khổ ngang nhỏ' },
    { value: 'A6', label: 'A6 (10.5cm x 14.8cm) - Khổ postcard' },
    { value: 'Letter', label: 'Letter (8.5" x 11") - Khổ Mỹ' },
    { value: 'Legal', label: 'Legal (8.5" x 14") - Khổ pháp lý' },
    { value: '80mm', label: '80mm - Máy in nhiệt (receipt)' }
  ];

  // Tạo dialog chọn kích thước giấy
  const selectedSize = await new Promise<string>((resolve) => {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">Chọn kích thước giấy in</h3>
      <div style="margin-bottom: 20px;">
        ${paperSizes.map(size => `
          <label style="display: block; margin: 10px 0; cursor: pointer; padding: 10px; border: 1px solid #ddd; border-radius: 5px; transition: all 0.2s;">
            <input type="radio" name="paperSize" value="${size.value}" style="margin-right: 10px;">
            <strong>${size.label}</strong>
          </label>
        `).join('')}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 5px; cursor: pointer;">Hủy</button>
        <button id="printBtn" style="padding: 10px 20px; background: #4285F4; color: white; border: none; border-radius: 5px; cursor: pointer;">In hóa đơn</button>
      </div>
    `;
    
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    
    // Xử lý sự kiện
    const cancelBtn = content.querySelector('#cancelBtn');
    const printBtn = content.querySelector('#printBtn');
    
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(dialog);
      resolve('A4'); // Mặc định A4
    });
    
    printBtn?.addEventListener('click', () => {
      const selected = content.querySelector('input[name="paperSize"]:checked') as HTMLInputElement;
      if (selected) {
        document.body.removeChild(dialog);
        resolve(selected.value);
      } else {
        alert('Vui lòng chọn kích thước giấy');
      }
    });
    
    // Đóng dialog khi click bên ngoài
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
        resolve('A4');
      }
    });
  });
  
  // In hóa đơn với kích thước đã chọn
  await printInvoice(order, products, selectedSize);
};

// Xuất PDF hóa đơn đơn lẻ (giữ lại cho trường hợp cần)
export const exportInvoicePDF = async (order: Order, products: Product[]) => {
  const doc = await initPDF();

  // Logo Oanh Cua
  try {
    const logoUrl = `${window.location.origin}/images/logo.jpeg`;
    const resp = await fetch(logoUrl, { mode: 'cors' });
    const blob = await resp.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    doc.addImage(dataUrl, 'JPEG', 15, 10, 35, 25);
  } catch (error) {
    // Không thể tải logo, sử dụng logo mặc định
    doc.setFillColor(66, 139, 202);
    doc.circle(30, 25, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('O', 30, 30, { align: 'center' });
  }

  // Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HOA DON BAN HANG', 105, 20, { align: 'center' });

  // Thông tin công ty
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('CONG TY TNHH ABM', 105, 35, { align: 'center' });
  doc.text('Chuyen cung cap cua bien chat luong cao', 105, 42, { align: 'center' });

  // Thông tin liên hệ
  doc.setFontSize(10);
  doc.text('Dia chi: 214F Nguyen Trai, Quan 1, TP.HCM', 105, 50, { align: 'center' });
  doc.text('Dien thoai: 0123.456.789 | Email: info@abm.vn', 105, 57, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Ma don hang: #${order.id}`, 20, 75);
  doc.text(`Ngay: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}`, 20, 85);
  doc.text(`Khach hang: ${order.customerName || 'N/A'}`, 20, 95);

  // Thông tin thanh toán
  doc.text(`Phuong thuc: ${getPaymentMethodLabel(order.paymentMethod)}`, 20, 105);

  // Bảng sản phẩm
  const tableData = (order.items || []).map(item => {
    const product = products.find(p => p.id === item.productId);
    const productName = product ? product.name : 'Không xác định';
    const total = (item.unitPrice || 0) * (item.quantity || 0);

    return [
      productName,
      item.quantity || 0,
      formatCurrency(item.unitPrice || 0),
      formatCurrency(total),
    ];
  });

  autoTable(doc, {
    head: [['San pham', 'So luong', 'Don gia', 'Thanh tien']],
    body: tableData,
    startY: 125,
    headStyles: {
      fillColor: [66, 139, 202],
      fontSize: 10,
      font: 'helvetica',
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      font: 'helvetica',
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 45, halign: 'left' },
    },
  });

  // Tổng tiền
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tong cong: ${formatCurrency(order.totalAmount || 0)}`, 150, finalY, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Cam on quy khach da mua hang!', 105, finalY + 20, { align: 'center' });
  doc.text('OANH CUA - Cua bien tuoi ngon chat luong cao', 105, finalY + 30, { align: 'center' });
  doc.text('Hotline: 0123.456.789 | Website: oanhcua.vn', 105, finalY + 38, { align: 'center' });

  // Thêm mã QR TikTok
  try {
    const tiktokUrl = 'https://www.tiktok.com/@oanhcua98';
    const qrCodeDataUrl = await QRCode.toDataURL(tiktokUrl, {
      width: 40,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    doc.addImage(qrCodeDataUrl, 'PNG', 160, finalY + 15, 30, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('TikTok', 175, finalY + 50, { align: 'center' });
    doc.text('@oanhcua98', 175, finalY + 55, { align: 'center' });
  } catch (error) {
    // Không thể tạo mã QR TikTok
  }

  // Lưu file
  doc.save(`hoa-don-${order.id || 'unknown'}.pdf`);
};

// Xuất Excel danh sách đơn hàng
export const exportOrdersExcel = (orders: Order[], products: Product[]) => {
  const excelData = orders.map(order => {
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A';
    const paymentMethod = getPaymentMethodLabel(order.paymentMethod);
    const paymentStatus = getPaymentStatusLabel(order.paymentStatus);

    const baseRow = {
      'Mã đơn hàng': order.id || '',
      'Khách hàng': order.customerName || 'N/A',
      'Ngày tạo': orderDate,
      'Phương thức thanh toán': paymentMethod,
      'Trạng thái thanh toán': paymentStatus,
      'Tổng tiền': order.totalAmount || 0,
    };

    if (order.items && order.items.length > 0) {
      return order.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const productName = product ? product.name : 'Không xác định';

        return {
          ...baseRow,
          'STT Item': index + 1,
          'Tên sản phẩm': productName,
          'Mã sản phẩm': item.productId,
          'Số lượng': item.quantity || 0,
          'Đơn giá': item.unitPrice || 0,
          'Thành tiền item': (item.unitPrice || 0) * (item.quantity || 0),
        };
      });
    } else {
      return [baseRow];
    }
  }).flat();

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách đơn hàng');

  const colWidths = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
  ];

  ws['!cols'] = colWidths;
  XLSX.writeFile(wb, `danh-sach-don-hang-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Xuất Excel đơn hàng đơn lẻ
export const exportOrderExcel = (order: Order, products: Product[]) => {
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A';
  const paymentMethod = getPaymentMethodLabel(order.paymentMethod);
  const paymentStatus = getPaymentStatusLabel(order.paymentStatus);

  const excelData = [
    {
      'Thông tin đơn hàng': '',
      'Mã đơn hàng': '',
      'Khách hàng': '',
      'Ngày tạo': '',
    },
    {
      'Thông tin đơn hàng': '',
      'Mã đơn hàng': order.id || '',
      'Khách hàng': order.customerName || 'N/A',
      'Ngày tạo': orderDate,
    },
    {
      'Thông tin đơn hàng': 'Phương thức thanh toán',
      'Mã đơn hàng': paymentMethod,
      'Khách hàng': 'Trạng thái thanh toán',
      'Ngày tạo': paymentStatus,
    },
    {
      'Thông tin đơn hàng': '',
      'Mã đơn hàng': '',
      'Khách hàng': '',
      'Ngày tạo': '',
    },
    {
      'STT': '',
      'Tên sản phẩm': '',
      'Mã sản phẩm': '',
      'Số lượng': '',
      'Đơn giá': '',
      'Thành tiền': '',
    },
  ];

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const product = products.find(p => p.id === item.productId);
      const productName = product ? product.name : 'Không xác định';

      excelData.push({
        'STT': (index + 1).toString(),
        'Tên sản phẩm': productName,
        'Mã sản phẩm': item.productId,
        'Số lượng': (item.quantity || 0).toString(),
        'Đơn giá': (item.unitPrice || 0).toString(),
        'Thành tiền': ((item.unitPrice || 0) * (item.quantity || 0)).toString(),
      });
    });
  }

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Đơn hàng ${order.id}`);

  const colWidths = [
    { wch: 8 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
  ];

  ws['!cols'] = colWidths;
  XLSX.writeFile(wb, `don-hang-${order.id}.xlsx`);
};

// Helper functions
const getPaymentMethodLabel = (method: string) => {
  const methods: Record<string, string> = {
    cash: 'Tiền mặt',
    bank: 'Chuyển khoản',
    transfer: 'Chuyển khoản',
    card: 'Thẻ tín dụng',
  };
  return methods[method] || method;
};

const getPaymentStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán',
    partial: 'Thanh toán một phần',
  };
  return statuses[status] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
