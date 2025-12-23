import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, User, Gift, DailyClosure, PaymentMethod, CashAdjustment } from '../types';
import { Search, Plus, Minus, ShoppingBag, CheckCircle, Edit3, Gift as GiftIcon, Archive, X, AlertCircle, CreditCard, Banknote, Smartphone, AlertTriangle, UserCheck } from 'lucide-react';
import { storageService } from '../services/storage.ts';

interface POSProps {
  products: Product[];
  currentUser: User;
  onSaleComplete: () => void;
}

export const POS: React.FC<POSProps> = ({ products, currentUser, onSaleComplete }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showSuccess, setShowSuccess] = useState(false);

  // Modals state
  const [editPriceItem, setEditPriceItem] = useState<{id: string, currentPrice: number, originalPrice: number} | null>(null);
  const [priceReason, setPriceReason] = useState('');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState('');

  // Adjustment (Furo/Sobra) State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjType, setAdjType] = useState<'SOBRA' | 'FALTA'>('FALTA');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjJustification, setAdjJustification] = useState('');
  
  // Gift Form
  const [giftForm, setGiftForm] = useState({ influencer: '', authorizer: '' });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.stock > 0;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        originalPrice: product.price,
        priceNote: '' 
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const product = products.find(p => p.id === id);
        if (newQty <= 0) return item; 
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handlePriceClick = (item: CartItem) => {
    setEditPriceItem({ id: item.id, currentPrice: item.price, originalPrice: item.originalPrice });
    setPriceReason(item.priceNote || '');
  };

  const savePriceChange = () => {
    if (!editPriceItem) return;
    if (editPriceItem.currentPrice !== editPriceItem.originalPrice && !priceReason.trim()) {
      alert("Por favor, explique o motivo da alteração de preço.");
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === editPriceItem.id) {
        return { ...item, price: editPriceItem.currentPrice, priceNote: priceReason };
      }
      return item;
    }));
    setEditPriceItem(null);
    setPriceReason('');
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalOriginal = cart.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);

  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;
    setPaymentMethod(null);
    setPaymentDetails('');
    setShowPaymentModal(true);
  };

  const handleFinalizeSale = () => {
    if (!paymentMethod) {
      alert("Selecione uma forma de pagamento.");
      return;
    }
    const sale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        priceAtSale: item.price,
        note: item.priceNote
      })),
      total: total,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails
    };
    storageService.createSale(sale);
    setShowPaymentModal(false);
    setShowSuccess(true);
    setCart([]);
    onSaleComplete();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRecordAttendance = () => {
    storageService.recordAttendance({id: currentUser.id, name: currentUser.name}, false);
    alert("Atendimento registrado! Este dado será usado no cálculo de sua produtividade técnica.");
  };

  const handleSaveAdjustment = () => {
    if (!adjAmount || !adjJustification) {
      alert("Preencha o valor e a justificativa.");
      return;
    }
    storageService.createAdjustment({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjType,
      amount: parseFloat(adjAmount),
      justification: adjJustification,
      performedBy: currentUser.name
    });
    setShowAdjustmentModal(false);
    setAdjAmount('');
    setAdjJustification('');
    alert("Ajuste registrado com sucesso.");
  };

  const handleGiftCheckout = () => {
    if (cart.length === 0 || !giftForm.influencer || !giftForm.authorizer) {
      alert("Preencha todos os campos da parceria.");
      return;
    }
    storageService.createGift({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      influencerName: giftForm.influencer,
      authorizedBy: giftForm.authorizer,
      items: cart,
      totalValue: totalOriginal
    });
    setShowGiftModal(false);
    setCart([]);
    setGiftForm({ influencer: '', authorizer: '' });
    onSaleComplete();
    alert("Saída de parceria registrada.");
  };

  const getDailyStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const sales = storageService.getSales().filter(s => s.date.startsWith(today));
    const gifts = storageService.getGifts().filter(g => g.date.startsWith(today));
    const adjustments = storageService.getAdjustments().filter(a => a.date.startsWith(today));
    const attendances = storageService.getAttendances().filter(a => a.date.startsWith(today));

    const breakdown: Record<string, number> = { 'DINHEIRO': 0, 'PIX': 0, 'CARTAO': 0, 'OUTRO': 0, 'CREDITO_LOJA': 0 };
    sales.forEach(s => { breakdown[s.paymentMethod || 'OUTRO'] += s.total; });
    const adjustmentsTotal = adjustments.reduce((acc, adj) => acc + (adj.type === 'SOBRA' ? adj.amount : -adj.amount), 0);

    return {
      salesTotal: sales.reduce((acc, s) => acc + s.total, 0),
      salesCount: sales.length,
      giftsTotal: gifts.reduce((acc, g) => acc + g.totalValue, 0),
      giftsCount: gifts.length,
      attendancesCount: attendances.length,
      paymentBreakdown: breakdown,
      adjustments,
      adjustmentsTotal
    };
  };

  const handleCloseRegister = () => {
    const stats = getDailyStats();
    storageService.createClosure({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      closedBy: currentUser.name,
      totalSales: stats.salesTotal,
      totalGifts: stats.giftsTotal,
      salesCount: stats.salesCount,
      giftsCount: stats.giftsCount,
      attendancesCount: stats.attendancesCount,
      adjustmentsTotal: stats.adjustmentsTotal,
      paymentBreakdown: stats.paymentBreakdown as Record<PaymentMethod, number>
    });
    setShowCloseRegisterModal(false);
    alert("Caixa fechado com sucesso!");
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <select 
            value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 bg-white"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const isLowStock = product.stock < 5;
            return (
              <div 
                key={product.id} onClick={() => addToCart(product)}
                className={`group border rounded-xl p-3 transition-all cursor-pointer flex flex-col ${isLowStock ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300 relative overflow-hidden">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <ShoppingBag size={32} />}
                </div>
                <h4 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">{product.name}</h4>
                <div className="mt-auto flex justify-between items-center">
                  <span className="font-bold text-primary-600">R$ {product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400">Est: {product.stock}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="font-serif font-bold text-lg">Carrinho</h2>
          <div className="flex gap-1.5">
             <button onClick={handleRecordAttendance} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1 font-bold">
               <UserCheck size={12} /> Atender
             </button>
             <button onClick={() => setShowAdjustmentModal(true)} className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold">Ajuste</button>
             <button onClick={() => setShowCloseRegisterModal(true)} className="text-[10px] bg-gray-900 text-white px-2 py-1 rounded-md font-bold">Fechar</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{item.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 border rounded-lg px-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={12}/></button>
                    <span className="text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={12}/></button>
                  </div>
                  <button onClick={() => handlePriceClick(item)} className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</button>
                </div>
              </div>
            </div>
          ))}
          {showSuccess && <div className="text-center text-emerald-500 py-10"><CheckCircle size={48} className="mx-auto mb-2"/> Venda OK!</div>}
        </div>

        <div className="p-4 bg-gray-50 border-t space-y-3">
          <div className="flex justify-between items-center"><span className="text-gray-500">Total</span><span className="text-2xl font-bold">R$ {total.toFixed(2)}</span></div>
          <div className="flex gap-2">
             <button onClick={() => setShowGiftModal(true)} disabled={cart.length === 0} className="p-3 bg-purple-100 text-purple-700 rounded-xl"><GiftIcon size={20}/></button>
             <button onClick={handleInitiateCheckout} disabled={cart.length === 0} className="flex-1 bg-primary-600 text-white font-bold py-3 rounded-xl shadow-lg">Finalizar Venda</button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h3 className="font-bold text-xl mb-6">Pagamento</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['DINHEIRO', 'PIX', 'CARTAO'].map(m => (
                <button 
                  key={m} onClick={() => setPaymentMethod(m as PaymentMethod)}
                  className={`p-3 rounded-xl border-2 text-[10px] font-bold ${paymentMethod === m ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                >
                  {m === 'DINHEIRO' && <Banknote className="mx-auto mb-1" />}
                  {m === 'PIX' && <Smartphone className="mx-auto mb-1" />}
                  {m === 'CARTAO' && <CreditCard className="mx-auto mb-1" />}
                  {m}
                </button>
              ))}
            </div>
            <textarea 
              className="w-full border rounded-xl p-3 text-sm mb-4" rows={3} placeholder="Detalhes (Maquininha, Nome do Pix...)"
              value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)}
            ></textarea>
            <button onClick={handleFinalizeSale} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold">Confirmar Venda</button>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="text-orange-500" /> Ajuste de Caixa</h3>
            <div className="flex gap-2 mb-4">
               <button onClick={() => setAdjType('FALTA')} className={`flex-1 py-2 text-xs rounded-lg ${adjType === 'FALTA' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>Saída</button>
               <button onClick={() => setAdjType('SOBRA')} className={`flex-1 py-2 text-xs rounded-lg ${adjType === 'SOBRA' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>Entrada</button>
            </div>
            <input type="number" className="w-full border rounded-lg p-2 mb-4" placeholder="Valor R$" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} />
            <textarea className="w-full border rounded-lg p-2 text-xs mb-4" placeholder="Justificativa..." value={adjJustification} onChange={e => setAdjJustification(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setShowAdjustmentModal(false)} className="flex-1 py-2">Cancelar</button>
              <button onClick={handleSaveAdjustment} className="flex-1 py-2 bg-orange-600 text-white rounded-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
           <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <h3 className="font-bold text-xl mb-6">Fechamento do Dia</h3>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between"><span>Vendas Totais</span><span className="font-bold">R$ {getDailyStats().salesTotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Qtd Vendas</span><span className="font-bold">{getDailyStats().salesCount}</span></div>
                <div className="flex justify-between"><span>Atendimentos Realizados</span><span className="font-bold">{getDailyStats().attendancesCount}</span></div>
                <div className="flex justify-between border-t pt-2 text-orange-600"><span>Saldo de Ajustes</span><span className="font-bold">R$ {getDailyStats().adjustmentsTotal.toFixed(2)}</span></div>
              </div>
              <button onClick={handleCloseRegister} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Confirmar Fechamento</button>
              <button onClick={() => setShowCloseRegisterModal(false)} className="w-full py-3 text-gray-400">Voltar</button>
           </div>
        </div>
      )}

    </div>
  );
};