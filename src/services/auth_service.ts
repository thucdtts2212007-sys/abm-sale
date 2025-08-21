class AuthService {
  private static instance: AuthService;
  private adminLoggedIn = false;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  get isAdminLoggedIn(): boolean {
    return this.adminLoggedIn;
  }

  async login(name: string, password: string): Promise<boolean> {
    // Giả lập xử lý, có thể thêm độ trễ nhỏ nếu cần
    const ok = name === 'admin' && password === 'admin';
    if (ok) {
      this.adminLoggedIn = true;
      // Lưu vào localStorage để giữ trạng thái khi refresh
      localStorage.setItem('adminLoggedIn', 'true');
    }
    return ok;
  }

  logout(): void {
    this.adminLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
  }

  // Kiểm tra trạng thái đăng nhập từ localStorage khi khởi động
  checkLoginStatus(): void {
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    this.adminLoggedIn = loggedIn;
  }
}

export default AuthService.getInstance();
