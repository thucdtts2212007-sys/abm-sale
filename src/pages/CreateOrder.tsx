import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, PaymentMethod, PaymentStatus, CreateOrderItem, Order } from '../types';
import { subscribeToProducts, addOrder } from '../services/database';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { exportInvoicePDF, exportOrderExcel, printInvoice, printInvoiceWithSize } from '../services/exportService';

interface OrderLine {
  product: Product;
  quantity: number;
}

const CreateOrder: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash' as PaymentMethod);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid' as PaymentStatus);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToProducts((all) => {
      const activeOnly = all.filter(p => p.isActive !== false);
      setProducts(activeOnly);
    });
    return unsubscribe;
  }, []);

  // Lấy danh sách sản phẩm chưa được chọn
  const availableProducts = products.filter(
    product => !lines.some(line => line.product.id === product.id)
  );

  const addLine = () => {
    if (availableProducts.length > 0) {
      setLines([...lines, { product: availableProducts[0], quantity: 1 }]);
    }
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLineQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const newLines = [...lines];
    newLines[index].quantity = quantity;
    setLines(newLines);
  };

  const updateLineProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newLines = [...lines];
    newLines[index].product = product;
    setLines(newLines);
  };

  const totalAmount = lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0);

  const kgEquivalent = (product: Product, quantity: number) => {
    if (product.crabsPerKg === 0) return '0 kg';
    const kg = quantity / product.crabsPerKg;
    return `${kg.toFixed(2)} kg`;
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      await printInvoiceWithSize(order, products);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Có lỗi xảy ra khi in hóa đơn');
    }
  };

  const handleExportExcel = (order: Order) => {
    try {
      exportOrderExcel(order, products);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Có lỗi xảy ra khi xuất Excel');
    }
  };

  const handleSave = async () => {
    if (customerName.trim() === '' || lines.length === 0) {
      alert('Vui lòng nhập tên khách hàng và chọn ít nhất một sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const orderItems: CreateOrderItem[] = lines.map(line => ({
        productId: line.product.id!,
        quantity: line.quantity,
        unitPrice: line.product.price,
        crabsPerKgSnapshot: line.product.crabsPerKg,
        unitCostPerCrab: line.product.crabsPerKg === 0 
          ? 0 
          : line.product.costPerKg / line.product.crabsPerKg,
      }));

      const orderId = await addOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod,
        paymentStatus,
        totalAmount,
        items: orderItems,
      });

      // Tạo order object để hiển thị trong modal
      const newOrder: Order = {
        id: orderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod,
        paymentStatus,
        totalAmount,
        createdAt: new Date(),
        items: orderItems.map(item => ({
          id: undefined,
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          crabsPerKgSnapshot: item.crabsPerKgSnapshot,
          unitCostPerCrab: item.unitCostPerCrab,
        }))
      };

      setCreatedOrder(newOrder);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              aria-label="Quay lại trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lên đơn hàng</h1>
              <p className="text-gray-600">Tạo đơn hàng mới cho khách hàng</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nhập tên khách hàng"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ví dụ: 09xxxxxxxx"
                    />
                  </div>
                  <div>
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Địa chỉ giao hàng / ghi chú"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                      Phương thức thanh toán
                    </label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="transfer">Chuyển khoản</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái thanh toán
                    </label>
                    <select
                      id="paymentStatus"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="unpaid">Chưa thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="error">Lỗi</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg shadow p-6">
                             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-gray-900">Sản phẩm</h2>
                                   <div className="flex space-x-2">
                    <button
                      onClick={addLine}
                      disabled={availableProducts.length === 0}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm sản phẩm
                    </button>
                  </div>
               </div>

              {lines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có sản phẩm nào. Hãy thêm sản phẩm để bắt đầu.
                </div>
              ) : (
                <div className="space-y-4">
                  {lines.map((line, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Dòng {index + 1}
                        </span>
                        <button
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          aria-label="Xóa dòng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sản phẩm
                          </label>
                                                     <select
                             value={line.product.id}
                             onChange={(e) => updateLineProduct(index, e.target.value)}
                             className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                             aria-label="Chọn sản phẩm"
                           >
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {product.price.toLocaleString('vi-VN')} ₫/con
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số lượng (con)
                          </label>
                                                     <input
                             type="number"
                             min="1"
                             value={line.quantity}
                             onChange={(e) => updateLineQuantity(index, parseInt(e.target.value) || 1)}
                             className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                             aria-label="Nhập số lượng"
                           />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thành tiền
                          </label>
                          <div className="text-sm text-gray-900">
                            {(line.quantity * line.product.price).toLocaleString('vi-VN')} ₫
                          </div>
                          <div className="text-xs text-gray-500">
                            {kgEquivalent(line.product, line.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-semibold text-lg text-primary-600">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số sản phẩm:</span>
                  <span className="font-medium">{lines.length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium">
                    {paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    paymentStatus === 'paid' 
                      ? 'bg-success-100 text-success-800'
                      : paymentStatus === 'unpaid'
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-danger-100 text-danger-800'
                  }`}>
                    {paymentStatus === 'paid' ? 'Đã thanh toán' : 
                     paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Lỗi'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading || customerName.trim() === '' || lines.length === 0}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Tạo đơn hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={createdOrder}
        products={products}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setCreatedOrder(null);
          navigate('/orders');
        }}
        onPrintInvoice={handlePrintInvoice}
      />
    </div>
  );
};

export default CreateOrder;
