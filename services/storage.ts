import { User, UserRole, Product, Sale, AuditLog, Gift, DailyClosure, LoginSession, CashAdjustment, Attendance, ServiceOrder, ServiceCategory, PCPTask, Purchase } from '../types';

const INITIAL_USERS: User[] = [
  { id: 'owner', name: 'Kethellem (Proprietária)', email: 'dona@loja.com', role: UserRole.OWNER, avatarSeed: 'Kethellem', password: 'admin123', status: 'Ativo' },
  { id: 's1', name: 'Ana Silva', email: 'ana@loja.com', role: UserRole.SELLER, avatarSeed: 'Ana', password: '123', status: 'Ativo' },
  { id: 's2', name: 'Beatriz Souza', email: 'beatriz@loja.com', role: UserRole.SELLER, avatarSeed: 'Beatriz', password: '123', status: 'Ativo' },
  { id: 's3', name: 'Carla Lima', email: 'carla@loja.com', role: UserRole.SELLER, avatarSeed: 'Carla', password: '123', status: 'Ativo' }
];

const INITIAL_PRODUCTS: Product[] = [
  { id: '101', name: 'Vestido Midi Floral Premium', category: 'Vestidos', price: 240.00, cost: 120.00, stock: 15, size: 'M', color: 'Floral', description: 'Vestido elegante para primavera.' },
  { id: '102', name: 'Blusa Seda Rose Chic', category: 'Blusas', price: 180.00, cost: 90.00, stock: 20, size: 'P', color: 'Rose', description: 'Blusa delicada.' },
  { id: '103', name: 'Calça Alfaiataria Lux', category: 'Calças', price: 320.00, cost: 160.00, stock: 8, size: '40', color: 'Preto', description: 'Corte moderno.' },
  { id: '104', name: 'Conjunto Tweed Inverno', category: 'Conjuntos', price: 450.00, cost: 225.00, stock: 10, size: 'G', color: 'Cinza', description: 'Peça de alto padrão.' },
];

const INITIAL_PCP: PCPTask[] = [
  { id: 'pcp1', dayOfWeek: 1, title: 'Chegada do Fardo', description: 'Recebimento da coleção nova e conferência inicial.', category: 'LOGISTICA', completed: false, time: '09:00' },
  { id: 'pcp2', dayOfWeek: 2, title: 'Conferência Cega', description: 'Contagem das peças sem ver a nota e Etiquetagem.', category: 'CONFERENCIA', completed: false, time: '10:00' },
  { id: 'pcp3', dayOfWeek: 3, title: 'Manutenção de Loja', description: 'Ajuste de Iluminação e Araras para o lançamento.', category: 'MANUTENCAO', completed: false, time: '14:00' },
  { id: 'pcp4', dayOfWeek: 4, title: 'Gravação (Videomaker)', description: 'Sessão de fotos e Reels para o Instagram.', category: 'PRODUCAO', completed: false, time: '13:00' },
  { id: 'pcp5', dayOfWeek: 5, title: 'Coquetel Lançamento', description: 'Evento oficial para clientes vips e amigas.', category: 'EVENTO', completed: false, time: '18:00' },
];

const KEYS = {
  USERS: 'chic_users',
  PRODUCTS: 'chic_products',
  SALES: 'chic_sales',
  SESSION: 'chic_session',
  AUDIT: 'chic_audit',
  GIFTS: 'chic_gifts',
  CLOSURES: 'chic_closures',
  LOGIN_LOGS: 'chic_login_logs',
  ADJUSTMENTS: 'chic_adjustments',
  ATTENDANCES: 'chic_attendances',
  SERVICE_ORDERS: 'chic_service_orders',
  PCP: 'chic_pcp_tasks',
  PURCHASES: 'chic_purchases'
};

const getDemoData = () => {
  const mockSales: Sale[] = [];
  const mockAttendances: Attendance[] = [];
  const mockServiceOrders: ServiceOrder[] = [];
  
  const sellers = INITIAL_USERS.filter(u => u.role === UserRole.SELLER);
  
  // Generating data for Jan to Nov 2025 to ensure DRE is populated
  for (let month = 0; month <= 10; month++) {
    // Each month fixed and variable expenses
    mockServiceOrders.push({
      id: `os-fix-${month}-1`,
      date: new Date(2025, month, 5).toISOString(),
      category: 'MARKETING',
      providerName: 'Agência Digital Rio Branco',
      description: 'Gestão de tráfego pago (Facebook/Instagram Ads)',
      amount: 1250.00,
      status: 'PAGO',
      performedBy: 'Kethellem (Proprietária)'
    });
    mockServiceOrders.push({
      id: `os-fix-${month}-2`,
      date: new Date(2025, month, 10).toISOString(),
      category: 'VIDEOMAKER',
      providerName: 'Luz & Som Produções',
      description: 'Cobertura de lançamento e Reels semanais',
      amount: 950.00,
      status: 'PAGO',
      performedBy: 'Kethellem (Proprietária)'
    });
    mockServiceOrders.push({
      id: `os-fix-${month}-3`,
      date: new Date(2025, month, 15).toISOString(),
      category: 'OUTROS',
      providerName: 'Contabilidade Acre Ltda',
      description: 'Honorários Contábeis',
      amount: 450.00,
      status: 'PAGO',
      performedBy: 'Kethellem (Proprietária)'
    });

    // Sales following markup rules (Cost ~50% of Price)
    sellers.forEach(seller => {
      // Sellers have different performance
      const salesCount = seller.id === 's1' ? 40 : (seller.id === 's2' ? 30 : 25);
      for (let i = 0; i < salesCount; i++) {
        const day = 1 + Math.floor(Math.random() * 28);
        const randomProduct = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
        const qty = 1 + Math.floor(Math.random() * 2);
        const saleValue = randomProduct.price * qty;
        
        const pMethods: any[] = ['PIX', 'CARTAO', 'CARTAO', 'DINHEIRO'];
        const pMethod = pMethods[Math.floor(Math.random() * pMethods.length)];
        
        mockSales.push({
          id: `demo-sale-2025-${month}-${seller.id}-${i}`,
          date: new Date(2025, month, day, 10 + (i % 8), 0).toISOString(),
          sellerId: seller.id,
          sellerName: seller.name,
          items: [{
            productId: randomProduct.id,
            productName: randomProduct.name,
            quantity: qty,
            priceAtSale: randomProduct.price
          }],
          total: saleValue,
          paymentMethod: pMethod,
          paymentDetails: 'Demonstração de Venda 2025'
        });

        mockAttendances.push({
          id: `att-demo-${month}-${seller.id}-${i}`,
          date: new Date(2025, month, day).toISOString(),
          sellerId: seller.id,
          sellerName: seller.name,
          wasSale: true
        });
      }
    });
  }

  return { mockSales, mockAttendances, mockServiceOrders };
};

export const storageService = {
  hasUsers: (): boolean => storageService.getUsers().length > 0,
  
  login: async (email: string, password: string): Promise<User | null> => {
    const users = storageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      storageService.recordLogin(user);
      return user;
    }
    return null;
  },

  logout: () => localStorage.removeItem(KEYS.SESSION),
  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  getAttendances: (): Attendance[] => {
    const stored = localStorage.getItem(KEYS.ATTENDANCES);
    if (!stored) {
      const { mockAttendances } = getDemoData();
      localStorage.setItem(KEYS.ATTENDANCES, JSON.stringify(mockAttendances));
      return mockAttendances;
    }
    return JSON.parse(stored);
  },

  recordAttendance: (seller: {id: string, name: string}, wasSale: boolean = false) => {
    const attendances = storageService.getAttendances();
    attendances.push({ id: Date.now().toString(), date: new Date().toISOString(), sellerId: seller.id, sellerName: seller.name, wasSale });
    localStorage.setItem(KEYS.ATTENDANCES, JSON.stringify(attendances));
  },

  getUsers: (): User[] => {
    const stored = localStorage.getItem(KEYS.USERS);
    if (!stored) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(stored);
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  updateUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === user.id) localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    }
  },

  deleteUser: (id: string, performedBy: string) => {
    const users = storageService.getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete) {
      storageService.addAuditLog({
        id: Date.now().toString(),
        action: 'USUÁRIO_EXCLUÍDO',
        description: `Exclusão definitiva de ${userToDelete.name} (${userToDelete.role})`,
        performedBy: performedBy,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(KEYS.USERS, JSON.stringify(users.filter(u => u.id !== id)));
    }
  },

  verifyOwnerPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const owner = users.find(u => u.role === UserRole.OWNER);
    return owner ? owner.password === password : false;
  },

  verifyAuditorPassword: (password: string): boolean => {
    const users = storageService.getUsers();
    const auditor = users.find(u => u.role === UserRole.AUDITOR);
    return auditor ? auditor.password === password : false;
  },

  getAuditLogs: (): AuditLog[] => JSON.parse(localStorage.getItem(KEYS.AUDIT) || '[]'),
  
  addAuditLog: (log: AuditLog) => {
    const logs = storageService.getAuditLogs();
    logs.unshift(log); 
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(logs));
  },

  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(stored);
  },
  
  saveProduct: (product: Product) => {
    const products = storageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) products[index] = product;
    else products.push(product);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = storageService.getProducts();
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products.filter(p => p.id !== id)));
  },
  
  getSales: (): Sale[] => {
    const stored = localStorage.getItem(KEYS.SALES);
    // Force seeding if data exists but it's not the new 2025 demo data
    if (!stored || (stored && !stored.includes('demo-sale-2025'))) {
      const { mockSales, mockAttendances, mockServiceOrders } = getDemoData();
      localStorage.setItem(KEYS.SALES, JSON.stringify(mockSales));
      localStorage.setItem(KEYS.ATTENDANCES, JSON.stringify(mockAttendances));
      localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(mockServiceOrders));
      return mockSales;
    }
    return JSON.parse(stored);
  },

  createSale: (sale: Sale) => {
    const sales = storageService.getSales();
    sales.push(sale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    storageService.recordAttendance({id: sale.sellerId, name: sale.sellerName}, true);
  },

  getAdjustments: (): CashAdjustment[] => JSON.parse(localStorage.getItem(KEYS.ADJUSTMENTS) || '[]'),
  
  createAdjustment: (adjustment: CashAdjustment) => {
    const adjustments = storageService.getAdjustments();
    adjustments.push(adjustment);
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  },

  getGifts: (): Gift[] => JSON.parse(localStorage.getItem(KEYS.GIFTS) || '[]'),
  createGift: (gift: Gift) => {
    const gifts = storageService.getGifts();
    gifts.push(gift);
    localStorage.setItem(KEYS.GIFTS, JSON.stringify(gifts));
  },

  getServiceOrders: (): ServiceOrder[] => {
    const stored = localStorage.getItem(KEYS.SERVICE_ORDERS);
    if (!stored) {
      const { mockServiceOrders } = getDemoData();
      localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(mockServiceOrders));
      return mockServiceOrders;
    }
    return JSON.parse(stored);
  },

  saveServiceOrder: (order: ServiceOrder) => {
    const orders = storageService.getServiceOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) orders[index] = order;
    else orders.push(order);
    localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(orders));
  },

  deleteServiceOrder: (id: string) => {
    const orders = storageService.getServiceOrders();
    localStorage.setItem(KEYS.SERVICE_ORDERS, JSON.stringify(orders.filter(o => o.id !== id)));
  },

  getPurchases: (): Purchase[] => JSON.parse(localStorage.getItem(KEYS.PURCHASES) || '[]'),
  savePurchase: (purchase: Purchase) => {
    const purchases = storageService.getPurchases();
    purchases.push(purchase);
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  },

  getPCPTasks: (): PCPTask[] => {
    const stored = localStorage.getItem(KEYS.PCP);
    if (!stored) {
      localStorage.setItem(KEYS.PCP, JSON.stringify(INITIAL_PCP));
      return INITIAL_PCP;
    }
    return JSON.parse(stored);
  },

  savePCPTask: (task: PCPTask) => {
    const tasks = storageService.getPCPTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) tasks[index] = task;
    else tasks.push(task);
    localStorage.setItem(KEYS.PCP, JSON.stringify(tasks));
  },

  deletePCPTask: (id: string) => {
    const tasks = storageService.getPCPTasks();
    localStorage.setItem(KEYS.PCP, JSON.stringify(tasks.filter(t => t.id !== id)));
  },

  getClosures: (): DailyClosure[] => JSON.parse(localStorage.getItem(KEYS.CLOSURES) || '[]'),
  createClosure: (closure: DailyClosure) => {
    const closures = storageService.getClosures();
    closures.push(closure);
    localStorage.setItem(KEYS.CLOSURES, JSON.stringify(closures));
  },

  recordLogin: (user: User) => {
    const logs: LoginSession[] = JSON.parse(localStorage.getItem(KEYS.LOGIN_LOGS) || '[]');
    logs.unshift({ id: Date.now().toString(), userId: user.id, userName: user.name, role: user.role, loginTime: new Date().toISOString() });
    localStorage.setItem(KEYS.LOGIN_LOGS, JSON.stringify(logs));
  },
  getLoginLogs: (): LoginSession[] => JSON.parse(localStorage.getItem(KEYS.LOGIN_LOGS) || '[]'),
  
  seedMockData: () => {
    localStorage.clear();
    window.location.reload();
  }
};