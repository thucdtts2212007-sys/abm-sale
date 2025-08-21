# 🦀 ABM Sales - Hệ thống quản lý bán hàng cua

## 📋 Mô tả dự án

ABM Sales là một hệ thống quản lý bán hàng chuyên biệt cho việc kinh doanh cua, được xây dựng với React, TypeScript và Firebase. Hệ thống hỗ trợ cả vai trò Staff (nhân viên bán hàng) và Admin (quản lý hệ thống).

## ✨ Tính năng chính

### 👥 **Vai trò Staff**
- Tạo đơn hàng mới
- Xem danh sách hóa đơn
- In hóa đơn
- Xuất Excel

### 🛡️ **Vai trò Admin**
- Dashboard với biểu đồ thống kê
- Quản lý sản phẩm (thêm, sửa, xóa, kích hoạt/vô hiệu hóa)
- Quản lý đơn hàng
- Xem báo cáo doanh thu và lợi nhuận
- Phân tích sản phẩm bán chạy

## 🚀 Công nghệ sử dụng

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Firebase (Firestore, Authentication)
- **Build Tool:** Vite
- **Deployment:** GitHub Pages

## 📱 Responsive Design

Hệ thống được thiết kế responsive hoàn toàn:
- **Desktop:** Giao diện bảng đầy đủ
- **Mobile:** Card view tối ưu, không cần kéo ngang
- **Tablet:** Layout trung gian phù hợp

## 🎯 Tính năng nổi bật

### 📊 **Dashboard Analytics**
- Biểu đồ doanh thu và lợi nhuận theo thời gian
- Biểu đồ trạng thái đơn hàng
- Top 5 sản phẩm bán chạy
- Thống kê tổng quan

### 🔍 **Tìm kiếm và Lọc**
- Tìm kiếm đơn hàng theo tên khách hàng
- Lọc theo trạng thái thanh toán
- Bộ lọc thời gian (ngày/tháng/năm)

### 📄 **Xuất dữ liệu**
- Xuất Excel cho tất cả đơn hàng
- In hóa đơn với nhiều kích thước
- Xuất PDF hóa đơn

## 🏗️ Cấu trúc dự án

```
src/
├── components/          # React components
├── pages/              # Các trang chính
├── services/           # Firebase services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 16+ 
- npm hoặc yarn

### Cài đặt dependencies
```bash
cd abm/web-app
npm install
```

### Chạy development server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🔧 Cấu hình Firebase

1. Tạo project Firebase mới
2. Bật Firestore Database
3. Bật Authentication
4. Cập nhật file `firebase.ts` với config của bạn

## 📱 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px  
- **Desktop:** > 1024px

## 🎨 Design System

### Màu sắc chính
- **Primary:** Blue (#3B82F6)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Danger:** Red (#EF4444)

### Typography
- **Font:** Inter
- **Sizes:** Responsive (text-sm → text-lg)

## 📊 Performance

- Lazy loading cho components
- Memoization với useMemo và useCallback
- Responsive images và charts
- Optimized bundle size

## 🔒 Bảo mật

- Role-based access control
- Firebase Authentication
- Secure API endpoints
- Input validation

## 🚀 Deployment

### GitHub Pages
```bash
npm run deploy
```

### Manual Build
```bash
npm run build
# Upload dist/ folder lên hosting
```

## 📈 Roadmap

- [ ] Thêm biểu đồ theo dõi xu hướng
- [ ] Tích hợp thanh toán online
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Multi-language support

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 📞 Liên hệ

- **Email:** support@abmsales.com
- **Website:** https://abmsales.com
- **GitHub:** https://github.com/yourusername/abm-sales

---

**Made with ❤️ by ABM Team**
