import React, { useState, useEffect } from 'react';
import { Plus, EyeOff, Package } from 'lucide-react';
import { Product } from '../types';
import { subscribeToProducts, addProduct, deactivateProduct } from '../services/database';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    crabsPerKg: '3',
    costPerKg: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToProducts(setProducts);
    setLoading(false);
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      crabsPerKg: parseInt(formData.crabsPerKg),
      costPerKg: parseFloat(formData.costPerKg)
    };

    try {
      // Chỉ cho tạo mới; không cho sửa sản phẩm hiện có
      await addProduct(productData);
      
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm');
    }
  };

  const handleDeactivate = async (product: Product) => {
    if (!product.id) return;
    if (!window.confirm(`Ẩn sản phẩm "${product.name}"?`)) return;
    try {
      await deactivateProduct(product.id.toString());
    } catch (error) {
      console.error('Error deactivating product:', error);
      alert('Có lỗi xảy ra khi ẩn sản phẩm');
    }
  };

  // Không còn xóa sản phẩm – chỉ ẩn

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      crabsPerKg: '3',
      costPerKg: ''
    });
  };

  const openModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý danh sách sản phẩm cua
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu bằng cách thêm sản phẩm đầu tiên.
          </p>
          <div className="mt-6">
            <button
              onClick={openModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.crabsPerKg || 0} con/kg
                    </p>
                  </div>
                  {/* Badge trạng thái ẩn/hiện */}
                  <div>
                    {product.isActive === false ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                        Đang ẩn
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Đang bán
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Giá bán/con:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(product.price || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Giá vốn/kg:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(product.costPerKg || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Lợi nhuận/con:</span>
                    <span className="text-sm font-medium text-success-600">
                      {((product.price || 0) - (product.costPerKg || 0) / (product.crabsPerKg || 1)).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex">
                  <button
                    onClick={() => handleDeactivate(product)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-danger-600 hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    {product.isActive === false ? 'Bỏ ẩn' : 'Ẩn sản phẩm'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tên sản phẩm
                    </label>
                                         <input
                       type="text"
                       required
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                       aria-label="Tên sản phẩm"
                     />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giá bán theo con (₫)
                    </label>
                                         <input
                       type="number"
                       required
                       min="0"
                       step="1000"
                       value={formData.price}
                       onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                       aria-label="Giá bán theo con"
                     />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Số con trên 1 kg
                    </label>
                                         <select
                       value={formData.crabsPerKg}
                       onChange={(e) => setFormData({ ...formData, crabsPerKg: e.target.value })}
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                       aria-label="Số con trên 1 kg"
                     >
                      <option value="3">3 con/kg</option>
                      <option value="4">4 con/kg</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giá vốn theo kg (₫)
                    </label>
                                         <input
                       type="number"
                       required
                       min="0"
                       step="1000"
                       value={formData.costPerKg}
                       onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                       aria-label="Giá vốn theo kg"
                     />
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
