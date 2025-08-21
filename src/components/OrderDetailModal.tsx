import React from 'react';
import { X, Printer } from 'lucide-react';
import { Order, Product } from '../types';

interface OrderDetailModalProps {
  order: Order | null;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice: (order: Order) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  products,
  isOpen,
  onClose,
  onPrintInvoice
}) => {
  if (!isOpen || !order) return null;

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Không xác định';
  };

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.price : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Tiền mặt',
      bank: 'Chuyển khoản',
      card: 'Thẻ tín dụng'
    };
    return methods[method] || method;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      partial: 'Thanh toán một phần'
    };
    return statuses[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h2>
            <div className="mt-2">
              <span className="inline-block bg-primary-100 text-primary-800 text-base sm:text-lg font-mono px-2 sm:px-3 py-1 rounded-lg border">
                #{order.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await onPrintInvoice(order);
                } catch (error) {
                  console.error('Lỗi khi in hóa đơn:', error);
                  alert('Có lỗi xảy ra khi in hóa đơn');
                }
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              aria-label="In hóa đơn"
            >
              <Printer size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">In hóa đơn</span>
              <span className="sm:hidden">In</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Đóng modal"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Mã đơn hàng:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 font-mono text-base sm:text-lg text-primary-600 font-bold">#{order.id}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Khách hàng:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base">{order.customerName || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-gray-700 text-sm sm:text-base">Số điện thoại:</span>
                    <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base">{order.customerPhone || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <span className="font-medium text-gray-700 text-sm sm:text-base">Địa chỉ:</span>
                    <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base break-words">
                      {order.customerAddress || '-'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Ngày tạo:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base">
                    {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Phương thức thanh toán:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Trạng thái thanh toán:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 text-gray-900 text-sm sm:text-base">
                    {getPaymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 text-sm sm:text-base">Tổng tiền:</span>
                  <span className="mt-1 sm:mt-0 sm:ml-2 text-lg sm:text-xl font-bold text-blue-600">
                    {formatCurrency(order.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {order.items?.length || 0}
                  </div>
                  <div className="text-gray-600 text-sm sm:text-base">Sản phẩm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sản phẩm</h3>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Số lượng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Đơn giá
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getProductName(item.productId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unitPrice || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-blue-600">
                      {formatCurrency(order.totalAmount || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {getProductName(item.productId)}
                        </h4>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-semibold text-blue-600">
                          {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Số lượng: {item.quantity}</span>
                      <span>Đơn giá: {formatCurrency(item.unitPrice || 0)}</span>
                    </div>
                  </div>
                ))}
                
                {/* Total Summary for Mobile */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Tổng cộng:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(order.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
