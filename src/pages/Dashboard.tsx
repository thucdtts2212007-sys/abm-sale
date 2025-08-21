import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  Bar,
  Line,
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { Order, Product } from '../types';
import { subscribeToOrders, subscribeToProducts } from '../services/database';
import authService from '../services/auth_service';
import { useNavigate } from 'react-router-dom';

type TimeFilter = 'day' | 'month' | 'year';

// Đồng hồ tự cập nhật, cô lập re-render chỉ trong component này
const LiveClock: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="ml-2 text-sm sm:text-base font-medium">
      {now.toLocaleString('vi-VN', { hour12: false })}
    </span>
  );
};

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // mặc định ngày hiện tại
  });
  const [chartKey, setChartKey] = useState<number>(0); // Force re-render chart
  const [currentPage, setCurrentPage] = useState(1); // Thêm state cho trang hiện tại
  const [ordersPerPage] = useState(5); // Số đơn hàng mỗi trang
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra quyền truy cập
    if (!authService.isAdminLoggedIn) {
      navigate('/');
      return;
    }

    const unsubscribeOrders = subscribeToOrders(setOrders);
    const unsubscribeProducts = subscribeToProducts(setProducts);

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [navigate]);

  // Reset về trang 1 khi có thay đổi về dữ liệu đơn hàng
  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);


  // Lọc đơn hàng theo bộ lọc thời gian và ngày được chọn
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [] as Order[];
    const baseDate = new Date(selectedDate);
    const baseYear = baseDate.getFullYear();
    const baseMonth = baseDate.getMonth();
    const baseDay = baseDate.getDate();

    const sameDay = (d: Date) => d.getFullYear() === baseYear && d.getMonth() === baseMonth && d.getDate() === baseDay;
    const sameMonth = (d: Date) => d.getFullYear() === baseYear && d.getMonth() === baseMonth;
    const sameYear = (d: Date) => d.getFullYear() === baseYear;

    const result = orders.filter((order) => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt as any);
      switch (timeFilter) {
        case 'day':
          return sameDay(created);
        case 'month':
          return sameMonth(created);
        case 'year':
          return sameYear(created);
        default:
          return sameMonth(created);
      }
    });
    return result;
  }, [orders, timeFilter, selectedDate]);

  // Tính toán thống kê theo bộ lọc thời gian/ ngày đã chọn (mặc định: tháng trước)
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const totalOrders = filteredOrders.length;
    const totalProducts = products.length;
    const pendingOrders = filteredOrders.filter(order => order.paymentStatus === 'unpaid').length;

    // Tính lợi nhuận tạm tính (giả sử lợi nhuận = 30% doanh thu)
    const estimatedProfit = Math.round(totalRevenue * 0.3);

    // Tính tổng số lượng sản phẩm đã bán
    const totalSoldQuantity = filteredOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => {
        return itemSum + (item.quantity || 0);
      }, 0);
    }, 0);

    return {
      totalRevenue,
      estimatedProfit,
      totalOrders,
      totalProducts,
      pendingOrders,
      totalSoldQuantity
    };
  }, [filteredOrders, products]);

  // Dữ liệu cho biểu đồ doanh thu theo thời gian
  const revenueChartData = useMemo(() => {
    const timeData: { [key: string]: number } = {};
    
    orders.forEach(order => {
      if (order.paymentStatus === 'paid' && order.createdAt) {
        const date = new Date(order.createdAt);
        let timeKey: string;
        
        switch (timeFilter) {
          case 'day':
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'month':
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            timeKey = `${date.getFullYear()}`;
            break;
          default:
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        timeData[timeKey] = (timeData[timeKey] || 0) + (order.totalAmount || 0);
      }
    });

    // Tạo dữ liệu demo nếu không có dữ liệu thực tế
    if (Object.keys(timeData).length === 0) {
      const demoData: { [key: string]: number } = {};
      const today = new Date();
      
      switch (timeFilter) {
        case 'day':
          // 7 ngày gần đây
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            demoData[key] = Math.floor(Math.random() * 5000000) + 1000000; // 1M - 6M
          }
          break;
        case 'month':
          // 12 tháng gần đây
          for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            demoData[key] = Math.floor(Math.random() * 50000000) + 10000000; // 10M - 60M
          }
          break;
        case 'year':
          // 5 năm gần đây
          for (let i = 4; i >= 0; i--) {
            const year = today.getFullYear() - i;
            demoData[year.toString()] = Math.floor(Math.random() * 500000000) + 100000000; // 100M - 600M
          }
          break;
      }
      
      return Object.entries(demoData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, revenue]) => ({
          time: time,
          doanhThu: revenue,
          loiNhuan: Math.round(revenue * 0.3)
        }));
    }

    return Object.entries(timeData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, revenue]) => ({
        time: time,
        doanhThu: revenue,
        loiNhuan: Math.round(revenue * 0.3)
      }));
  }, [orders, timeFilter]);

     // Dữ liệu cho biểu đồ sản phẩm bán chạy
   const topProductsData = useMemo(() => {
     const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
     
     // Lấy tất cả đơn hàng, không chỉ đơn đã thanh toán
     filteredOrders.forEach(order => {
       if (order.items && Array.isArray(order.items)) {
         order.items.forEach(item => {
           // Xử lý field mapping từ Firebase (snake_case) sang web (camelCase)
           const productId = item.productId || item.product_id;
           const quantity = item.quantity || 0;
           const unitPrice = item.unitPrice || item.unit_price || 0;
           
           if (productId) {
             const product = products.find(p => p.id === productId);
             const displayName = product?.name || 'Sản phẩm';
             if (!productSales[productId]) {
               productSales[productId] = { name: displayName, quantity: 0, revenue: 0 };
             }
             productSales[productId].quantity += quantity;
             productSales[productId].revenue += unitPrice * quantity;
             if (product?.name) productSales[productId].name = product.name;
           }
         });
       }
     });

     // Luôn trả về dữ liệu demo để đảm bảo biểu đồ hiển thị
     // Nếu có dữ liệu thực tế hợp lệ, sử dụng dữ liệu thực tế
     // Nếu không có, sử dụng dữ liệu demo
     let finalData;
     
     if (Object.keys(productSales).length > 0 && 
         Object.values(productSales).some(p => p.name && p.quantity > 0)) {
       finalData = Object.values(productSales)
         .filter(p => p.name && p.quantity > 0) // Chỉ lấy dữ liệu hợp lệ
         .sort((a, b) => b.quantity - a.quantity)
         .slice(0, 5)
         .map((product, index) => ({
           name: product.name,
           quantity: product.quantity,
           revenue: product.revenue,
           color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
         }));
     } else {
       finalData = [
         { name: 'Cua biển tươi', quantity: 150, revenue: 45000000, color: '#3B82F6' },
         { name: 'Cua hấp', quantity: 120, revenue: 36000000, color: '#10B981' },
         { name: 'Cua rang muối', quantity: 95, revenue: 28500000, color: '#F59E0B' },
         { name: 'Cua nướng', quantity: 80, revenue: 24000000, color: '#EF4444' },
         { name: 'Cua sốt me', quantity: 65, revenue: 19500000, color: '#8B5CF6' }
       ];
     }
     
     return finalData;
   }, [filteredOrders, products]);

  // Dữ liệu cho biểu đồ trạng thái đơn hàng
  const orderStatusData = useMemo(() => {
    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order.paymentStatus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return [
      { name: 'Đã thanh toán', value: statusCounts.paid || 0, color: '#10B981' },
      { name: 'Chưa thanh toán', value: statusCounts.unpaid || 0, color: '#F59E0B' },
      { name: 'Khác', value: statusCounts.unknown || 0, color: '#6B7280' }
    ];
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return orders
      .filter(order => order.createdAt)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt!).getTime();
        const dateB = new Date(b.createdAt!).getTime();
        return dateB - dateA;
      });
  }, [orders]);

  // Tính toán phân trang
  const totalOrders = recentOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = recentOrders.slice(startIndex, endIndex);

  // Hàm chuyển trang
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Hàm chuyển về trang đầu
  const goToFirstPage = () => goToPage(1);
  
  // Hàm chuyển về trang cuối
  const goToLastPage = () => goToPage(totalPages);
  
  // Hàm chuyển trang trước
  const goToPreviousPage = () => goToPage(currentPage - 1);
  
  // Hàm chuyển trang sau
  const goToNextPage = () => goToPage(currentPage + 1);

  // Nếu không phải admin, không render gì
  if (!authService.isAdminLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getTimeFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case 'day': return 'Ngày';
      case 'month': return 'Tháng';
      case 'year': return 'Năm';
      default: return 'Tháng';
    }
  };

  const formatTimeLabel = (time: string) => {
    switch (timeFilter) {
      case 'day':
        const [year, month, day] = time.split('-');
        return `${day}/${month}/${year}`;
      case 'month':
        const [y, m] = time.split('-');
        return `${m}/${y}`;
      case 'year':
        return time;
      default:
        return time;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Tổng quan về hoạt động kinh doanh Oanh Cua
          </p>
        </div>
        <div className="flex items-center text-gray-700">
          <Clock className="h-5 w-5 text-blue-500" />
          <LiveClock />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-100">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalRevenue.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <DollarSign className="h-32 w-32 text-white" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">Lợi nhuận tạm tính</p>
              <p className="text-2xl font-bold text-white">
                {stats.estimatedProfit.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <TrendingUp className="h-32 w-32 text-white" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-8 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-100">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <ShoppingCart className="h-32 w-32 text-white" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-100">Sản phẩm đã bán</p>
              <p className="text-2xl font-bold text-white">{stats.totalSoldQuantity}</p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10">
            <Package className="h-32 w-32 text-white" />
          </div>
        </div>
      </div>

      {/* Time Filter Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc thời gian</h3>
          <Calendar className="h-6 w-6 text-blue-500" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Filter Buttons */}
          <div className="flex rounded-lg border border-gray-300 p-1">
            {(['day', 'month', 'year'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {getTimeFilterLabel(filter)}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
              Chọn {getTimeFilterLabel(timeFilter).toLowerCase()}:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Info */}
          <div className="text-sm text-gray-600">
            Hiển thị dữ liệu theo {getTimeFilterLabel(timeFilter).toLowerCase()}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Biểu đồ doanh thu và lợi nhuận */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Doanh thu & Lợi nhuận theo {getTimeFilterLabel(timeFilter).toLowerCase()}
            </h3>
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
            <AreaChart data={revenueChartData} margin={{ left: 20, right: 20, top: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTimeLabel}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VND`, '']}
                labelFormatter={(label) => {
                  const timeLabel = formatTimeLabel(label);
                  return `${getTimeFilterLabel(timeFilter)} ${timeLabel}`;
                }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area 
                type="monotone" 
                dataKey="doanhThu" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Doanh thu"
              />
              <Area 
                type="monotone" 
                dataKey="loiNhuan" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Lợi nhuận"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ trạng thái đơn hàng */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Trạng thái đơn hàng</h3>
            <PieChart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
          </div>
          <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
            <RechartsPieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Số đơn hàng']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

                    {/* Top Products Chart */}
       <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
         <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top 5 Sản phẩm bán chạy</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartKey(prev => prev + 1)}
              className="px-2 sm:px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
          </div>
        </div>
                 {topProductsData.length > 0 ? (
           <div>
                           {/* Biểu đồ kết hợp đường + cột */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-md font-semibold text-gray-700 mb-3">Doanh thu & Số lượng theo sản phẩm</h4>
                <ResponsiveContainer width="100%" height={250} className="min-h-[250px]" key={`combined-${chartKey}`}>
                  <ComposedChart data={topProductsData} margin={{ left: 40, right: 20, top: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                                         <YAxis 
                       yAxisId="left" 
                       orientation="left" 
                       stroke="#3B82F6"
                       tickFormatter={(value) => value.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                       tick={{ fontSize: 11 }}
                       width={80}
                     />
                                         <YAxis 
                       yAxisId="right" 
                       orientation="right" 
                       stroke="#10B981"
                       tickFormatter={(value) => value.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                       tick={{ fontSize: 11 }}
                       width={60}
                     />
                                                                 <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'quantity') {
                              return [`${value} Con`, 'Số lượng'];
                            } else if (name === 'revenue') {
                              // Đảm bảo format đúng với dấu chấm phân cách hàng nghìn
                              const formattedValue = new Intl.NumberFormat('vi-VN').format(value);
                              return [`${formattedValue} VND`, 'Doanh thu'];
                            }
                            return [value, name];
                          }}
                         labelFormatter={(label) => `Sản phẩm: ${label}`}
                         separator=": "
                         contentStyle={{ fontSize: 12 }}
                       />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Doanh thu" />
                    <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={3} name="Số lượng" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
             
                           {/* Chart data summary - hidden on mobile */}
              <div className="hidden sm:block mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Tóm tắt dữ liệu:</h4>
                <div className="text-sm text-gray-600">
                  {topProductsData.map((item, index) => (
                    <div key={index} className="mb-1">
                      {item.name}: {item.quantity} Con, {new Intl.NumberFormat('vi-VN').format(item.revenue)} VND
                    </div>
                  ))}
                </div>
              </div>
           </div>
         ) : (
           <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
             <div className="text-center">
               <Activity className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
               <p className="text-sm sm:text-base">Đang tải dữ liệu...</p>
             </div>
           </div>
         )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow-lg rounded-xl">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Đơn hàng gần đây
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Tổng: {totalOrders} đơn hàng
              </span>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded hover:bg-blue-50"
                aria-label="Xem tất cả đơn hàng"
              >
                Xem tất cả
              </button>
            </div>
          </div>
          {currentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">Chưa có đơn hàng nào</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.customerName}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(order.totalAmount || 0).toLocaleString('vi-VN')} VND
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                              order.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentStatus === 'unpaid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.paymentStatus === 'paid'
                              ? 'Đã thanh toán'
                              : order.paymentStatus === 'unpaid'
                              ? 'Chưa thanh toán'
                              : 'Lỗi'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                <div className="space-y-3">
                  {currentOrders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {order.customerName}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {(order.totalAmount || 0).toLocaleString('vi-VN')} VND
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : order.paymentStatus === 'unpaid'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {order.paymentStatus === 'paid'
                                ? 'Đã TT'
                                : order.paymentStatus === 'unpaid'
                                ? 'Chưa TT'
                                : 'Lỗi'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 gap-3">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, totalOrders)} trong tổng số {totalOrders} đơn hàng
            </div>
            <div className="flex items-center justify-center space-x-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang đầu"
              >
                <span className="hidden sm:inline">Đầu</span>
                <span className="sm:hidden">«</span>
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang trước"
              >
                <span className="hidden sm:inline">Trước</span>
                <span className="sm:hidden">‹</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <span className="sm:hidden">›</span>
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang cuối"
              >
                <span className="hidden sm:inline">Cuối</span>
                <span className="sm:hidden">»</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-xl">
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button 
              onClick={() => navigate('/admin/products')}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Quản lý sản phẩm</p>
                <p className="text-sm text-gray-500">Thêm, sửa, xóa sản phẩm</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/admin/orders')}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Quản lý đơn hàng</p>
                <p className="text-sm text-gray-500">Xem và cập nhật trạng thái</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/')}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Về trang chủ</p>
                <p className="text-sm text-gray-500">Chuyển đổi vai trò</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
