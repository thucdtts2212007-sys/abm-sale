import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RoleSelect from './pages/RoleSelect';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chính - chọn role */}
        <Route path="/" element={<RoleSelect />} />
        
        {/* Staff routes - không cần layout */}
        <Route path="/staff/create-order" element={<CreateOrder />} />
        
        {/* Admin routes - có layout */}
        <Route path="/admin/*" element={
          <Layout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
            </Routes>
          </Layout>
        } />
        
        {/* Orders route cho cả Staff và Admin */}
        <Route path="/orders" element={<Orders />} />
        
        {/* Fallback */}
        <Route path="*" element={<RoleSelect />} />
      </Routes>
    </Router>
  );
}

export default App;
