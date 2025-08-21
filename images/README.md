# Thư mục hình ảnh cho Oanh Cua Web App

## Logo và hình ảnh

Thư mục này chứa các hình ảnh được sử dụng trong ứng dụng web Oanh Cua.

### Logo chính

**File:** `logo.jpeg` ✅ **ĐÃ CÓ SẴN**

**Kích thước:** 35x25px trong PDF (tự động điều chỉnh)
**Định dạng:** JPEG
**Vị trí:** Góc trái trên của hóa đơn PDF

### Mã hóa đơn

**Format mới:** `YYYYMMDD-HHMMSS-XXX`
- **YYYYMMDD:** Ngày tháng năm
- **HHMMSS:** Giờ phút giây tạo đơn
- **XXX:** Thứ tự đơn trong cùng giây (001, 002, ...)

**Ví dụ:** `20250820-143052-001` (20/08/2025, 14:30:52, đơn thứ 1)

### Cách sử dụng

1. **Đặt logo vào thư mục này:**
   - Tên file: `logo-oanh-cua.png`
   - Hoặc: `logo-oanh-cua.jpg`

2. **Logo sẽ được tự động sử dụng trong:**
   - Hóa đơn PDF
   - Header của ứng dụng
   - Các báo cáo xuất ra

3. **Nếu không có logo:**
   - Hệ thống sẽ sử dụng logo mặc định (hình tròn màu xanh với chữ "O")

### Cập nhật logo

Sau khi thay đổi logo:
1. Đặt file mới vào thư mục này
2. Đảm bảo tên file đúng: `logo-oanh-cua.png`
3. Refresh trang web để áp dụng thay đổi

### Lưu ý

- Logo nên có kích thước vừa phải để không làm chậm tải trang
- Sử dụng định dạng PNG để có chất lượng tốt nhất
- Đảm bảo logo có độ tương phản tốt với nền trắng

## Mã QR TikTok

### Tự động tạo

Hệ thống sẽ tự động tạo mã QR cho TikTok của Oanh Cua:
- **URL:** https://www.tiktok.com/@oanhcua98
- **Vị trí:** Góc phải dưới của hóa đơn PDF
- **Kích thước:** 30x30px
- **Màu sắc:** Đen trên nền trắng

### Tính năng

- Mã QR được tạo động khi xuất PDF
- Khách hàng có thể quét để truy cập TikTok
- Tăng khả năng tiếp cận khách hàng qua mạng xã hội
- Tự động cập nhật nếu thay đổi URL TikTok

### Cập nhật URL TikTok

Để thay đổi URL TikTok, cập nhật trong file `src/services/exportService.ts`:
```typescript
const tiktokUrl = 'https://www.tiktok.com/@oanhcua98';
```
