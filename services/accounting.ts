import * as XLSX from 'xlsx';
import { Sale, ServiceOrder, Product, User, UserRole } from '../types';

export interface AccountingSettings {
  taxRate: number; // e.g., 0.155 for 15.5% (Lucro Presumido Acre retail estimate)
  mdrPix: number;
  mdrCard: number;
  mdrCash: number;
}

export const accountingService = {
  getDefaultSettings: (): AccountingSettings => {
    const stored = localStorage.getItem('chic_accounting_settings');
    // Using a realistic 15.5% tax load for Lucro Presumido retail in Acre context
    return stored ? JSON.parse(stored) : {
      taxRate: 0.155, 
      mdrPix: 0.009, // 0.9%
      mdrCard: 0.035, // 3.5%
      mdrCash: 0
    };
  },

  saveSettings: (settings: AccountingSettings) => {
    localStorage.setItem('chic_accounting_settings', JSON.stringify(settings));
  },

  calculateDRE: (month: number, year: number, data: {
    sales: Sale[],
    expenses: ServiceOrder[],
    products: Product[]
  }) => {
    const settings = accountingService.getDefaultSettings();
    const monthlySales = data.sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const revenue = monthlySales.reduce((acc, s) => acc + s.total, 0);
    const taxes = revenue * settings.taxRate;
    
    const mdr = monthlySales.reduce((acc, s) => {
      const rate = s.paymentMethod === 'PIX' ? settings.mdrPix : 
                   s.paymentMethod === 'CARTAO' ? settings.mdrCard : 
                   settings.mdrCash;
      return acc + (s.total * rate);
    }, 0);

    const expenses = data.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year && e.status === 'PAGO';
      })
      .reduce((acc, e) => acc + e.amount, 0);

    // DRE with 100% markup rule: Cost = 50% of Revenue
    const cmv = revenue * 0.50;

    const netProfit = revenue - taxes - mdr - expenses - cmv;

    return { revenue, taxes, mdr, expenses, cmv, netProfit };
  },

  exportMonthlyClosing: (month: number, year: number, data: {
    sales: Sale[],
    expenses: ServiceOrder[],
    inventory: Product[],
    users: User[]
  }) => {
    const settings = accountingService.getDefaultSettings();
    const workbook = XLSX.utils.book_new();

    // 1. Aba Vendas
    const salesData = data.sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(s => {
        const rate = s.paymentMethod === 'PIX' ? settings.mdrPix : 
                     s.paymentMethod === 'CARTAO' ? settings.mdrCard : 
                     settings.mdrCash;
        const mdrValue = s.total * rate;
        
        return {
          'Data': new Date(s.date).toLocaleDateString('pt-BR'),
          'ID Transação': s.id,
          'Valor Bruto (Base Imposto)': s.total,
          'MDR (Taxa Maquininha)': mdrValue,
          'Valor Líquido': s.total - mdrValue,
          'Meio de Pagamento': s.paymentMethod,
          'Vendedor': s.sellerName
        };
      });
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Vendas');

    // 2. Aba Despesas
    const expenseData = data.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(e => ({
        'Data': new Date(e.date).toLocaleDateString('pt-BR'),
        'Categoria': e.category,
        'Descrição': e.description,
        'Prestador': e.providerName,
        'Valor': e.amount,
        'Status': e.status
      }));
    const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Despesas');

    // 3. Aba Comissões
    const sellers = data.users.filter(u => u.role === UserRole.SELLER || u.id.startsWith('s'));
    const commissionData = sellers.map(seller => {
      const sellerSales = data.sales.filter(s => {
        const d = new Date(s.date);
        return s.sellerId === seller.id && d.getMonth() === month && d.getFullYear() === year;
      });
      const totalRevenue = sellerSales.reduce((acc, s) => acc + s.total, 0);
      return {
        'Vendedora': seller.name,
        'Total Vendido (R$)': totalRevenue,
        'Vendas Realizadas': sellerSales.length,
        '% Comissão': '3%',
        'Valor à Pagar (R$)': totalRevenue * 0.03
      };
    }).filter(c => c['Total Vendido (R$)'] > 0);
    const commissionSheet = XLSX.utils.json_to_sheet(commissionData);
    XLSX.utils.book_append_sheet(workbook, commissionSheet, 'Comissões');

    // 4. Aba Inventário
    const inventoryData = data.inventory.map(p => ({
      'SKU/Ref': p.id,
      'Descrição': p.name,
      'Qtd Estoque': p.stock,
      'Preço de Custo (un)': p.cost,
      'Valor Total em Custo': p.stock * p.cost
    }));
    const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventário');

    const fileName = `FECHAMENTO_CONTABIL_${month + 1}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
};