import { ref, get, set, push, update, remove, onValue, off } from 'firebase/database';
import { database } from './firebase';
import { Product, Order, CreateOrderItem } from '../types';

// Function tạo mã hóa đơn theo format: YYYYMMDD-HHMMSS-XXX
// XXX = số thứ tự ĐƠN TRONG NGÀY (đồng bộ với app mobile)
const generateOrderId = async (): Promise<string> => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  
  const timeStr = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0') + 
                  now.getSeconds().toString().padStart(2, '0');
  
  // Lấy số thứ tự đơn hàng trong CÙNG NGÀY
  try {
    const ordersRef = ref(database, 'abm/orders');
    const snapshot = await get(ordersRef);
    
    let maxSeqInDay = 0;
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        const orderDate = new Date(order.created_at || order.createdAt || 0);
        const orderDateStr = orderDate.getFullYear().toString() + 
                           (orderDate.getMonth() + 1).toString().padStart(2, '0') + 
                           orderDate.getDate().toString().padStart(2, '0');
        // Cùng ngày
        if (orderDateStr === dateStr) {
          const key = childSnapshot.key || '';
          const parts = key.split('-');
          const suffix = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(suffix)) {
            if (suffix > maxSeqInDay) maxSeqInDay = suffix;
          } else {
            // Nếu không parse được từ key, tăng dựa vào đếm
            maxSeqInDay += 1;
          }
        }
      });
    }
    
    // Số thứ tự cho đơn mới trong ngày
    const nextSeq = (maxSeqInDay + 1);
    
    // Format: YYYYMMDD-HHMMSS-001, YYYYMMDD-HHMMSS-002, ...
    return `${dateStr}-${timeStr}-${nextSeq.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating order ID:', error);
    // Fallback: sử dụng timestamp nếu có lỗi
    return `${dateStr}-${timeStr}-${Date.now().toString().slice(-3)}`;
  }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const snapshot = await get(ref(database, 'abm/products'));
    if (snapshot.exists()) {
      const products: Product[] = [];
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        
        // Map product với field names đúng từ database
        const mappedProduct: Product = {
          id: childSnapshot.key,
          name: product.name || '',
          price: product.price || 0,
          crabsPerKg: product.crabs_per_kg || product.crabsPerKg || 3,
          costPerKg: product.cost_per_kg || product.costPerKg || 0,
          createdAt: new Date(product.created_at || product.createdAt || Date.now()),
          isActive: typeof product.active === 'boolean' ? product.active : true,
        };
        products.push(mappedProduct);
      });
      return products;
    }
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const newProductRef = push(ref(database, 'abm/products'));
    const newProduct = {
      name: product.name,
      price: product.price,
      crabs_per_kg: product.crabsPerKg,
      cost_per_kg: product.costPerKg,
      created_at: new Date().toISOString(),
      active: true,
    };
    await set(newProductRef, newProduct);
    return newProductRef.key!;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  try {
    await update(ref(database, `abm/products/${id}`), updates);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await remove(ref(database, `abm/products/${id}`));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const deactivateProduct = async (id: string): Promise<void> => {
  try {
    const productRef = ref(database, `abm/products/${id}`);
    // Toggle: nếu active == false -> đặt true; ngược lại đặt false
    const snap = await get(productRef);
    const current = snap.exists() ? snap.val() : {};
    const currentActive = typeof current.active === 'boolean' ? current.active : true;
    await update(productRef, { active: !currentActive });
  } catch (error) {
    console.error('Error deactivating product:', error);
    throw error;
  }
};

// Orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const snapshot = await get(ref(database, 'abm/orders'));
    if (snapshot.exists()) {
      const orders: Order[] = [];
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        
        
        // Map order items với field names đúng
        const mappedItems = (order.items || []).map((item: any) => {
          
          const mappedItem = {
            id: item.id,
            orderId: childSnapshot.key,
            productId: item.product_id || item.productId || '',
            quantity: item.quantity || 0,
            unitPrice: item.unit_price || item.unitPrice || 0,
            crabsPerKgSnapshot: item.crabs_per_kg_snapshot || item.crabsPerKgSnapshot || 0,
            unitCostPerCrab: item.unit_cost_per_crab || item.unitCostPerCrab || 0,
          };
          
          return mappedItem;
        });

        orders.push({
          id: childSnapshot.key,
          customerName: order.customer_name || order.customerName || 'N/A',
          customerPhone: order.customer_phone || order.customerPhone,
          customerAddress: order.customer_address || order.customerAddress,
          paymentMethod: order.payment_method || order.paymentMethod || 'cash',
          paymentStatus: order.payment_status || order.paymentStatus || 'unpaid',
          totalAmount: order.total_amount || order.totalAmount || 0,
          createdAt: new Date(order.created_at || order.createdAt || Date.now()),
          items: mappedItems
        });
      });
      
      // Sắp xếp đơn hàng theo thứ tự logic: mới nhất trước, sau đó theo mã hóa đơn
      orders.sort((a, b) => {
        // Ưu tiên theo thời gian tạo (mới nhất trước)
        if (a.createdAt && b.createdAt) {
          const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
          if (Math.abs(timeDiff) > 60000) { // Nếu chênh lệch > 1 phút
            return timeDiff;
          }
        }
        
        // Nếu cùng thời gian, sắp xếp theo mã hóa đơn (giảm dần)
        if (a.id && b.id) {
          return b.id.localeCompare(a.id);
        }
        
        return 0;
      });
      
      return orders;
    }
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const addOrder = async (order: Omit<Order, 'id' | 'createdAt'> & { items?: CreateOrderItem[] }): Promise<string> => {
  try {
    // Tạo mã hóa đơn mới theo format YYYYMMDD-HHMMSS-XXX
    const customOrderId = await generateOrderId();
    
    // Map order items với field names đúng cho database
    const mappedItems = (order.items || []).map((item: CreateOrderItem) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      crabs_per_kg_snapshot: item.crabsPerKgSnapshot || 0,
      unit_cost_per_crab: item.unitCostPerCrab || 0,
    }));

    const newOrder = {
      customer_name: order.customerName,
      customer_phone: (order as any).customerPhone || '',
      customer_address: (order as any).customerAddress || '',
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      total_amount: order.totalAmount,
      created_at: new Date().toISOString(),
      items: mappedItems
    };
    
    // Sử dụng custom order ID thay vì Firebase push key
    await set(ref(database, `abm/orders/${customOrderId}`), newOrder);
    return customOrderId;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<void> => {
  try {
    const mapped: any = {};
    if (updates.customerName !== undefined) mapped['customer_name'] = updates.customerName as any;
    if (updates.paymentMethod !== undefined) mapped['payment_method'] = updates.paymentMethod as any;
    if (updates.paymentStatus !== undefined) mapped['payment_status'] = updates.paymentStatus as any;
    if (updates.totalAmount !== undefined) mapped['total_amount'] = updates.totalAmount as any;
    if (updates.createdAt !== undefined) mapped['created_at'] = (updates.createdAt as any)?.toString?.() || (updates.createdAt as any);

    // Nếu không có field nào hợp lệ, bỏ qua
    if (Object.keys(mapped).length === 0) return;

    await update(ref(database, `abm/orders/${id}`), mapped);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    await remove(ref(database, `abm/orders/${id}`));
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsRef = ref(database, 'abm/products');
  
  onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
      const products: Product[] = [];
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        // Map product với field names đúng từ database
        const mappedProduct: Product = {
          id: childSnapshot.key,
          name: product.name || '',
          price: product.price || 0,
          crabsPerKg: product.crabs_per_kg || product.crabsPerKg || 3,
          costPerKg: product.cost_per_kg || product.costPerKg || 0,
          createdAt: new Date(product.created_at || product.createdAt || Date.now()),
          isActive: typeof product.active === 'boolean' ? product.active : true,
        };
        products.push(mappedProduct);
      });
      callback(products);
    } else {
      callback([]);
    }
  });

  return () => off(productsRef);
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const ordersRef = ref(database, 'abm/orders');
  
  onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      const orders: Order[] = [];
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        
        // Map order items với field names đúng
        const mappedItems = (order.items || []).map((item: any) => {
          const mappedItem = {
            id: item.id,
            orderId: childSnapshot.key,
            productId: item.product_id || item.productId || '',
            quantity: item.quantity || 0,
            unitPrice: item.unit_price || item.unitPrice || 0,
            crabsPerKgSnapshot: item.crabs_per_kg_snapshot || item.crabsPerKgSnapshot || 0,
            unitCostPerCrab: item.unit_cost_per_crab || item.unitCostPerCrab || 0,
          };
          return mappedItem;
        });

        orders.push({
          id: childSnapshot.key,
          customerName: order.customer_name || order.customerName || 'N/A',
          customerPhone: order.customer_phone || order.customerPhone,
          customerAddress: order.customer_address || order.customerAddress,
          paymentMethod: order.payment_method || order.paymentMethod || 'cash',
          paymentStatus: order.payment_status || order.paymentStatus || 'unpaid',
          totalAmount: order.total_amount || order.totalAmount || 0,
          createdAt: new Date(order.created_at || order.createdAt || Date.now()),
          items: mappedItems
        });
      });
      
      // Sắp xếp đơn hàng theo thứ tự logic: mới nhất trước, sau đó theo mã hóa đơn
      orders.sort((a, b) => {
        // Ưu tiên theo thời gian tạo (mới nhất trước)
        if (a.createdAt && b.createdAt) {
          const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
          if (Math.abs(timeDiff) > 60000) { // Nếu chênh lệch > 1 phút
            return timeDiff;
          }
        }
        
        // Nếu cùng thời gian, sắp xếp theo mã hóa đơn (giảm dần)
        if (a.id && b.id) {
          return b.id.localeCompare(a.id);
        }
        
        return 0;
      });
      
      callback(orders);
    } else {
      callback([])
    }
  });

  return () => off(ordersRef);
};
