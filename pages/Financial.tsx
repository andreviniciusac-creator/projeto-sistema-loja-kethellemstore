import React, { useState, useMemo } from 'react';
import { ServiceOrder, ServiceCategory, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { 
  Plus, 
  Search, 
  Trash2, 
  Video, 
  Wrench, 
  Megaphone, 
  MoreHorizontal, 
  DollarSign, 
  X, 
  Calendar, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FinancialProps {
  currentUser: User;
}

export const Financial: React.FC<FinancialProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<ServiceOrder[]>(storageService.getServiceOrders());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    providerName: '',
    category: 'VIDEOMAKER' as ServiceCategory,
    description: '',
    amount: '',
    status: 'PAGO' as 'PAGO' | 'PENDENTE'
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.providerName.toLowerCase().includes(search.toLowerCase()) ||
      o.description.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, search]);

  const totals = useMemo(() => {
    const totalPaid = orders.filter(o => o.status === 'PAGO').reduce((acc, o) => acc + o.amount, 0);
    const totalPending = orders.filter(o => o.status === 'PENDENTE').reduce((acc, o) => acc + o.amount, 0);
    return { totalPaid, totalPending };
  }, [orders]);

  const handleSave = () => {
    if (!formData.providerName || !formData.amount) return alert("Preencha o prestador e o valor.");

    const newOrder: ServiceOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: formData.category,
      providerName: formData.providerName,
      description: formData.description,
      amount: parseFloat(formData.amount),
      status: formData.status,
      performedBy: currentUser.name
    };

    storageService.saveServiceOrder(newOrder);
    setOrders(storageService.getServiceOrders());
    setIsModalOpen(false);
    setFormData({ providerName: '', category: 'VIDEOMAKER', description: '', amount: '', status: 'PAGO' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Excluir este registro permanentemente?")) {
      storageService.deleteServiceOrder(id);
      setOrders(storageService.getServiceOrders());
    }
  };

  const getCategoryIcon = (cat: ServiceCategory) => {
    switch(cat) {
      case 'VIDEOMAKER': return <Video className="text-purple-600" />;
      case 'MANUTENCAO': return <Wrench className="text-orange-600" />;
      case 'MARKETING': return <Megaphone className="text-blue-600" />;
      default: return <MoreHorizontal className="text-gray-600" />;
    }
  };

  const getCategoryLabel = (cat: ServiceCategory) => {
    switch(cat) {
      case 'VIDEOMAKER': return 'Videomaker';
      case 'MANUTENCAO': return 'Manutenção';
      case 'MARKETING': return 'Marketing';
      default: return 'Outros';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 font-serif">Financeiro</h2>
          <p className="text-gray-500 font-medium">Controle de Ordens de Serviço (OS) e despesas externas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 font-bold"
        >
          <Plus size={20} />
          <span>Registrar OS</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600"><CheckCircle size={32} /></div>
          <div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Pago</span>
            <h3 className="text-3xl font-black text-gray-900">R$ {totals.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><AlertCircle size={32} /></div>
          <div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Pendente</span>
            <h3 className="text-3xl font-black text-gray-900">R$ {totals.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por prestador ou descrição..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/10 font-medium"
          />
        </div>
      </div>

      {/* Lista de Ordens */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-white transition-all">
                {getCategoryIcon(order.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">{getCategoryLabel(order.category)}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase"><Calendar size={10} /> {new Date(order.date).toLocaleDateString()}</span>
                </div>
                <h4 className="text-lg font-black text-gray-900">{order.providerName}</h4>
                <p className="text-sm text-gray-500 font-medium">{order.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8">
              <div className="text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block ${order.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.status}
                </span>
                <p className="text-xl font-black text-gray-900">R$ {order.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              
              <button 
                onClick={() => handleDelete(order.id)}
                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <DollarSign size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-black">Nenhuma ordem de serviço registrada.</p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 font-serif">Registrar Ordem de Serviço</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoria</label>
                  <select 
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as ServiceCategory})}
                  >
                    <option value="VIDEOMAKER">Videomaker</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'PAGO' | 'PENDENTE'})}
                  >
                    <option value="PAGO">Pago</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Prestador do Serviço</label>
                <input 
                  type="text" 
                  placeholder="Nome do profissional ou empresa"
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                  value={formData.providerName}
                  onChange={e => setFormData({...formData, providerName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Total (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00"
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 font-black text-2xl bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none text-primary-600"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição Curta</label>
                <textarea 
                  rows={3}
                  placeholder="O que foi realizado?"
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-[0.98]"
              >
                Salvar Ordem de Serviço
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};