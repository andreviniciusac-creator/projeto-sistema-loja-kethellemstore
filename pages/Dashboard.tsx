import React, { useMemo, useState } from 'react';
import { Sale, Product, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { DollarSign, ShoppingBag, TrendingUp, Users as UsersIcon, Award, Zap, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, users }) => {
  const currentUser = storageService.getCurrentUser();
  const isAdminOrHigher = currentUser && [UserRole.ADMIN, UserRole.OWNER, UserRole.AUDITOR].includes(currentUser.role);
  const attendances = storageService.getAttendances();

  // Mode: Monthly vs Total Period (to show the requested R$ 16k+ values)
  const [viewMode, setViewMode] = useState<'month' | 'total'>('total');
  const [selectedMonth, setSelectedMonth] = useState(10); // Nov 2025
  const [selectedYear, setSelectedYear] = useState(2025);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Filter logic
  const filteredSales = useMemo(() => {
    if (viewMode === 'total') {
      // Show data for Sep, Oct, Nov 2025
      return sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === 2025 && d.getMonth() >= 8 && d.getMonth() <= 10;
      });
    }
    return sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [sales, selectedMonth, selectedYear, viewMode]);

  const filteredAttendances = useMemo(() => {
    if (viewMode === 'total') {
      return attendances.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === 2025 && d.getMonth() >= 8 && d.getMonth() <= 10;
      });
    }
    return attendances.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [attendances, selectedMonth, selectedYear, viewMode]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    return { 
      totalRevenue, 
      totalSales: filteredSales.length, 
      totalAttendances: filteredAttendances.length 
    };
  }, [filteredSales, filteredAttendances]);

  const productivityData = useMemo(() => {
    const sellers = users.filter(u => u.role === UserRole.SELLER || u.id.startsWith('s'));
    return sellers.map(seller => {
      const sSales = filteredSales.filter(s => s.sellerId === seller.id);
      const sAtts = filteredAttendances.filter(a => a.sellerId === seller.id);
      
      const revenue = sSales.reduce((acc, s) => acc + s.total, 0);
      const atts = sAtts.length;
      // EP = Revenue / Total Attendances
      const ep = atts > 0 ? revenue / atts : 0;

      return {
        id: seller.id,
        name: seller.name,
        ep: ep,
        revenue: revenue,
        attendances: atts,
        avatar: seller.avatarSeed
      };
    }).filter(s => s.revenue > 0 || s.attendances > 0).sort((a, b) => b.ep - a.ep);
  }, [filteredSales, filteredAttendances, users]);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header Simplificado para a Dona */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-black text-gray-900 font-serif">Painel da Kethellem</h2>
          <p className="text-gray-500 font-medium">Resumo de Vendas e Produtividade das Vendedoras.</p>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setViewMode('total')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === 'total' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Últimos 3 Meses
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${viewMode === 'month' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {monthNames[selectedMonth]}
          </button>
        </div>
      </div>

      {/* Cartões Gigantes - Valores Explícitos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-100 relative overflow-hidden group">
           <div className="relative z-10">
              <span className="text-emerald-100 font-bold uppercase tracking-widest text-xs">Total Vendido na Loja</span>
              <h3 className="text-5xl font-black mt-2">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <p className="text-emerald-100 text-sm mt-6 font-medium flex items-center gap-2">
                <TrendingUp size={18} /> Dinheiro bruto que entrou no sistema.
              </p>
           </div>
           <DollarSign size={140} className="absolute -right-8 -bottom-8 text-emerald-500 opacity-20 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
           <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total de Atendimentos</span>
           <h3 className="text-5xl font-black text-gray-900 mt-2">{stats.totalAttendances}</h3>
           <p className="text-gray-500 text-sm mt-6 font-medium flex items-center gap-2">
             <UsersIcon size={18} className="text-primary-500" /> Clientes que foram atendidas.
           </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
           <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Ticket Médio Geral</span>
           <h3 className="text-5xl font-black text-primary-600 mt-2">R$ {(stats.totalRevenue / (stats.totalSales || 1)).toFixed(0)}</h3>
           <p className="text-gray-500 text-sm mt-6 font-medium flex items-center gap-2">
             <ShoppingBag size={18} className="text-primary-500" /> Valor médio de cada sacola.
           </p>
        </div>
      </div>

      {/* Seção de Poder de Venda - Bem Explícita */}
      <div className="pt-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2.5 rounded-2xl shadow-lg"><Star size={24} /></div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 font-serif">Poder de Venda (Persuasão)</h3>
            <p className="text-gray-500 font-medium">Quem consegue vender mais para cada cliente que entra.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Ranking com Valores Grandes */}
          <div className="xl:col-span-5 space-y-4">
            {productivityData.map((seller, idx) => {
              const colors = [
                { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', medal: '🥇', label: 'CAMPEÃ DE PERSUASÃO' },
                { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', medal: '🥈', label: '2º LUGAR TÉCNICO' },
                { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', medal: '🥉', label: '3º LUGAR TÉCNICO' }
              ];
              const style = colors[idx] || { bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-700', medal: '✨', label: `${idx + 1}º` };

              return (
                <div key={seller.id} className={`${style.bg} ${style.border} border-2 p-8 rounded-[40px] flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all`}>
                   <div className="flex items-center gap-5">
                      <div className="text-5xl">{style.medal}</div>
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${seller.avatar}&backgroundColor=ffe4e6`} alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${style.bg} ${style.text} border border-current mb-2 inline-block`}>{style.label}</span>
                         <h4 className="text-3xl font-black text-gray-900 truncate leading-tight">{seller.name}</h4>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-white/60 p-4 rounded-3xl">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Vendido</span>
                         <span className="text-2xl font-black text-gray-900">R$ {seller.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className="bg-primary-600 p-4 rounded-3xl text-white">
                         <span className="text-[10px] font-black text-primary-100 uppercase tracking-widest block mb-1">Média por Cliente</span>
                         <span className="text-2xl font-black">R$ {seller.ep.toFixed(0)}</span>
                      </div>
                   </div>

                   <p className="text-sm font-medium text-gray-600 italic bg-white/40 p-3 rounded-2xl border border-white/50">
                      "A cada 1 cliente atendida, {seller.name.split(' ')[0]} garante <span className="text-primary-600 font-bold">R$ {seller.ep.toFixed(0)}</span> no caixa da loja."
                   </p>
                </div>
              );
            })}
          </div>

          {/* Gráfico de Visualização Rápida */}
          <div className="xl:col-span-7 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-10">
               <h4 className="text-xl font-black text-gray-900 font-serif">Comparativo de Produtividade Técnica</h4>
               <p className="text-gray-500 text-sm">Mostra quem tem o maior poder de convencimento e conhecimento das roupas.</p>
            </div>
            
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#111827', fontWeight: '900', fontSize: 13}} 
                    dy={15}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 'bold', fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#fff1f2'}} 
                    contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '24px' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Venda p/ Cliente']}
                  />
                  <Bar dataKey="ep" radius={[20, 20, 0, 0]} barSize={80}>
                    {productivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#e11d48' : index === 1 ? '#fb7185' : '#fda4af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-10 bg-primary-50 p-6 rounded-3xl border border-primary-100 flex items-start gap-4">
               <div className="bg-primary-600 text-white p-2 rounded-xl mt-1"><Zap size={20} /></div>
               <div>
                 <span className="text-xs font-black text-primary-700 uppercase tracking-widest block mb-1">Dica do Sistema para a Dona:</span>
                 <p className="text-primary-900 font-medium">
                   A vendedora <span className="font-black underline">{productivityData[0]?.name}</span> é a sua melhor vendedora técnica! 
                   Embora outras possam atender mais gente, ela é quem faz cada atendimento valer mais dinheiro. Peça para ela treinar as outras no conhecimento das coleções.
                 </p>
               </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};