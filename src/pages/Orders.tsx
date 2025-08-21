import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, ShoppingCart, Download, Eye as EyeIcon, Edit, ArrowLeft, SquarePen } from 'lucide-react';
import { Order, Product, PaymentStatus, PaymentMethod } from '../types';
import { subscribeToOrders, subscribeToProducts, updateOrder, deleteOrder } from '../services/database';
import { useLocation, useNavigate } from 'react-router-dom';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { CreateOrderForm } from '../components/CreateOrderForm';
import { exportOrdersExcel, exportInvoicePDF, printInvoice, printInvoiceWithSize } from '../services/exportService';

interface OrdersProps {
  canEditStatus?: boolean;
}

const Orders: React.FC<OrdersProps> = ({ canEditStatus = true }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // 10 | 50 | 100
  const location = useLocation();
  const navigate = useNavigate();

  // Quy ước quyền chỉnh sửa:
  // - '/admin/orders' CHỈ XEM
  // - '/orders' (staff) ĐƯỢC CHỈNH SỬA
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminOrdersViewOnly = location.pathname === '/admin/orders';
  const isStaffOrders = location.pathname === '/orders';
  const canEdit = canEditStatus && (isStaffOrders || (isAdminRoute && !isAdminOrdersViewOnly));

  useEffect(() => {
    const unsubscribeOrders = subscribeToOrders(setOrders);
    const unsubscribeProducts = subscribeToProducts(setProducts);
    setLoading(false);
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.paymentStatus === filterStatus;
    const normalized = searchTerm.trim().toLowerCase().replace('#', '');
    const idStr = (order.id || '').toLowerCase();
    const nameStr = (order.customerName || '').toLowerCase();
    const matchesSearch = normalized === '' || nameStr.includes(normalized) || idStr.includes(normalized);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const handleStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    if (!canEdit) return;
    
    try {
      await updateOrder(orderId, { paymentStatus: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      try {
        await deleteOrder(id);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Có lỗi xảy ra khi xóa đơn hàng');
      }
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Không xác định';
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      paid: { label: 'Đã thanh toán', className: 'bg-success-100 text-success-800' },
      unpaid: { label: 'Chưa thanh toán', className: 'bg-warning-100 text-warning-800' },
      error: { label: 'Lỗi', className: 'bg-danger-100 text-danger-800' }
    };

    const config = statusConfig[status] || { label: 'N/A', className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    if (!method) return 'N/A';
    return method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
  };

  const handleViewDetail = (order: Order) => {
    // Map thêm sdt/địa chỉ nếu đang ở dạng any từ DB
    const enriched: Order = {
      ...order,
      customerPhone: (order as any).customerPhone || (order as any).customer_phone || order.customerPhone,
      customerAddress: (order as any).customerAddress || (order as any).customer_address || order.customerAddress,
    } as Order;
    setDetailOrder(enriched);
    setShowDetailModal(true);
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      await printInvoiceWithSize(order, products);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Có lỗi xảy ra khi in hóa đơn');
    }
  };

  // Không còn export Excel từng đơn

  const handleExportAllOrders = () => {
    try {
      exportOrdersExcel(orders, products);
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Có lỗi xảy ra khi xuất Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isAdminRoute ? 'Quản lý đơn hàng' : 'Đơn hàng'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isAdminRoute 
                ? 'Xem và quản lý tất cả đơn hàng trong hệ thống'
                : 'Xem và cập nhật trạng thái đơn hàng'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {canEdit && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo đơn hàng
              </button>
            )}
            
            <div className="flex gap-2">
                             <button
                 onClick={() => exportOrdersExcel(filteredOrders, products)}
                 className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Xuất Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              
              {!isAdminRoute && (
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Về Admin</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Tìm kiếm</label>
            <input
              type="text"
              id="search"
              placeholder="Tìm kiếm theo tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="status-filter" className="sr-only">Lọc theo trạng thái</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
              <option value="error">Lỗi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hàng</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Bắt đầu bằng cách tạo đơn hàng đầu tiên.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SĐT
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phương thức
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-primary-600">
                          #{order.id}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName || 'N/A'}
                          <div className="text-xs text-gray-500">{(order as any).customerAddress || ''}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(order as any).customerPhone || '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3 sm:space-x-4">
                          <button
                            onClick={() => handleViewDetail(order)}
                            className="text-primary-600 hover:text-primary-900 p-2 rounded-md hover:bg-gray-100"
                            aria-label="Xem chi tiết"
                            title="Xem chi tiết"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => {
                                  const current = order.paymentStatus as PaymentStatus;
                                  const next: PaymentStatus = current === PaymentStatus.PAID ? PaymentStatus.UNPAID : PaymentStatus.PAID;
                                  handleStatusChange(order.id!.toString(), next);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-gray-100"
                                aria-label="Chuyển trạng thái thanh toán"
                                title="Chuyển trạng thái thanh toán"
                              >
                                <SquarePen className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {pagedOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-mono font-bold text-primary-600">
                            #{order.id}
                          </span>
                          {getStatusBadge(order.paymentStatus)}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {order.customerName || 'N/A'}
                        </h3>
                        {(order as any).customerAddress && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {(order as any).customerAddress}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>SĐT: {(order as any).customerPhone || '-'}</span>
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="inline-flex items-center px-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Chi tiết
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => {
                            const current = order.paymentStatus as PaymentStatus;
                            const next: PaymentStatus = current === PaymentStatus.PAID ? PaymentStatus.UNPAID : PaymentStatus.PAID;
                            handleStatusChange(order.id!.toString(), next);
                          }}
                          className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <SquarePen className="h-4 w-4 mr-1" />
                          {order.paymentStatus === PaymentStatus.PAID ? 'Chưa TT' : 'Đã TT'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailModal
        order={detailOrder}
        products={products}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailOrder(null);
        }}
        onPrintInvoice={handlePrintInvoice}
        // per-order Excel export removed
      />

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {selectedOrder ? 'Chi tiết đơn hàng' : 'Tạo đơn hàng mới'}
                </h3>
                
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedOrder.totalAmount.toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <div className="mt-1">{getStatusBadge(selectedOrder.paymentStatus)}</div>
                      </div>
                    </div>
                    
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chi tiết sản phẩm</label>
                        <div className="border rounded-md divide-y">
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="p-3 flex justify-between">
                              <span className="text-sm text-gray-900">
                                {getProductName(item.productId)} x {item.quantity}
                              </span>
                              <span className="text-sm text-gray-900">
                                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <CreateOrderForm
                    onOrderCreated={(order) => {
                      setSelectedOrder(order);
                      setShowModal(false);
                    }}
                    onCancel={() => setShowModal(false)}
                  />
                )}

                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedOrder(null);
                    }}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Page Info */}
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Hiển thị {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filteredOrders.length)} 
              trong tổng số {filteredOrders.length} đơn hàng
            </div>
            
            {/* Page Size Selector */}
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-700">Hiển thị:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-center">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
              {/* First Page */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang đầu"
              >
                <span className="hidden sm:inline">Đầu</span>
                <span className="sm:hidden">«</span>
              </button>
              
              {/* Previous Page */}
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang trước"
              >
                <span className="hidden sm:inline">Trước</span>
                <span className="sm:hidden">‹</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pageNum
                          ? 'bg-primary-600 text-white border border-primary-600'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Next Page */}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <span className="sm:hidden">›</span>
              </button>
              
              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                aria-label="Trang cuối"
              >
                <span className="hidden sm:inline">Cuối</span>
                <span className="sm:hidden">»</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
