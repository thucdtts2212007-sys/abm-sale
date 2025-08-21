import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  User, 
  BarChart3, 
  Package, 
  Receipt, 
  Plus, 
  ShoppingCart 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth_service';
import LoginModal from '../components/LoginModal';

const RoleSelect: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'staff' | 'admin'>('staff');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập khi component mount
    authService.checkLoginStatus();
  }, []);

  const handleAdminAction = (route: string) => {
    if (!authService.isAdminLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate(route);
  };

  const handleLoginSuccess = () => {
    // Sau khi đăng nhập thành công, có thể navigate đến route admin
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setSelectedRole('staff');
  };

  const handleRoleChange = (role: 'staff' | 'admin') => {
    setSelectedRole(role);
    
    // Smooth scroll to the selected role card
    setTimeout(() => {
      const roleCard = document.querySelector(`[data-role="${role}"]`);
      if (roleCard) {
        roleCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">ABM Sales</h1>
          <p className="text-lg sm:text-xl text-gray-600">Hệ thống quản lý bán hàng cua</p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => handleRoleChange('staff')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 ${
                selectedRole === 'staff'
                  ? 'bg-success-500 text-white shadow-sm scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Staff
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 ${
                selectedRole === 'admin'
                  ? 'bg-primary-500 text-white shadow-sm scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Shield className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Admin
            </button>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Staff Card */}
          <div 
            data-role="staff"
            className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 ${
              selectedRole === 'staff' ? 'scale-105 ring-2 ring-success-200 shadow-xl' : 'opacity-75 hover:opacity-90'
            }`}
          >
            <div className="text-center mb-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                  <User className="w-8 h-8 text-success-600" />
                </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff</h2>
              <p className="text-gray-600">Nhân viên bán hàng</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/staff/create-order')}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Lên đơn hàng
              </button>
              
              <button
                onClick={() => navigate('/orders')}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3 border border-success-300 text-success-700 rounded-lg hover:bg-success-50 transition-colors text-sm sm:text-base"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Xem hóa đơn
              </button>
            </div>
          </div>

          {/* Admin Card */}
          <div 
            data-role="admin"
            className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 transition-all duration-300 ${
              selectedRole === 'admin' ? 'scale-105 ring-2 ring-primary-200 shadow-xl' : 'opacity-75 hover:opacity-90'
            }`}
          >
            <div className="text-center mb-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Shield className="w-8 h-8 text-primary-600" />
                </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin</h2>
              <p className="text-gray-600">Quản lý hệ thống</p>
              
              {authService.isAdminLoggedIn && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Đã đăng nhập
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAdminAction('/admin/dashboard')}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Dashboard
              </button>
              
              <button
                onClick={() => handleAdminAction('/admin/products')}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Quản lý sản phẩm
              </button>
              
              <button
                onClick={() => handleAdminAction('/admin/orders')}
                className="w-full flex items-center justify-center px-4 py-3 sm:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Quản lý hóa đơn
              </button>

              {authService.isAdminLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 sm:py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm sm:text-base"
                >
                  Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 sm:py-3 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors text-sm sm:text-base"
                >
                  Đăng nhập Admin
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-gray-500">
          <p className="mb-1">Staff: Không cần đăng nhập, có thể tạo đơn hàng và xem hóa đơn</p>
          <p>Admin: Cần đăng nhập để truy cập các tính năng quản trị</p>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default RoleSelect;
