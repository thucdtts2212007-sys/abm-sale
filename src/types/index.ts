export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer'
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  ERROR = 'error'
}

export interface Product {
  id?: string;
  name: string;
  price: number; // Giá bán theo 1 con
  crabsPerKg: number; // Cấu hình quy chuẩn: số con trên 1 kg (3 hoặc 4)
  costPerKg: number; // Giá vốn theo kg
  createdAt: Date;
  isActive?: boolean;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  crabsPerKgSnapshot?: number; // Snapshot để tính toán và báo cáo
  unitCostPerCrab?: number;
  // Firebase field names (snake_case) - để tương thích với dữ liệu từ Firebase
  product_id?: string;
  unit_price?: number;
  crabs_per_kg_snapshot?: number;
  unit_cost_per_crab?: number;
}

export interface CreateOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  crabsPerKgSnapshot?: number;
  unitCostPerCrab?: number;
  // Firebase field names (snake_case) - để tương thích với dữ liệu từ Firebase
  product_id?: string;
  unit_price?: number;
  crabs_per_kg_snapshot?: number;
  unit_cost_per_crab?: number;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  items?: OrderItem[] | CreateOrderItem[];
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  displayName?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
