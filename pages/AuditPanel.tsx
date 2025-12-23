
import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storage.ts';
import { User, UserRole, LoginSession, AuditLog } from '../types';
import { 
  Clock, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  UserMinus,
  Search,
  Calendar
} from 'lucide-react';

interface AuditPanelProps {
  currentUser: User;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'logs' | 'financial' | 'closures'>('financial');
  const [searchTerm, setSearchTerm] = useState('');
  
  const loginLogs = storageService.getLoginLogs();
  const auditLogs = storageService.getAuditLogs();
  const closures = storageService.getClosures();

  // Financial Trail: Combined view of everything that touched the money
  const financialTrail = useMemo(() => {
    const sales = storageService.getSales();
    const adjustments = storageService.getAdjustments();
    const serviceOrders = storageService.getServiceOrders().filter(o => o.status === 'PAGO');

    const combined = [
      ...sales.map(s => ({
        id: s.id,
        date: s.date,
        type: 'ENTRADA' as const,
        source: 'VENDA' as const,
        amount: s.total,
        description: `Venda #${s.id.slice(-4)} (${s.paymentMethod})`,
        performedBy: s.sellerName
      })),
      ...adjustments.map(a => ({
        id: a.id,
        date: a.date,
        type: a.type === 'SOBRA' ? 'ENTRADA' as const : 'SAÍDA' as const,
        source: 'AJUSTE' as const,
        amount: a.amount,
        description: `Ajuste: ${a.justification}`,
        performedBy: a.performedBy
      })),
      ...serviceOrders.map(o => ({
        id: o.id,
        date: o.date,
        type: 'SAÍDA' as const,
        source: 'PAGAMENTO OS' as const,
        amount: o.amount,
        description: `${o.providerName}: ${o.description}`,
        performedBy: o.performedBy
      }))
    ];

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filtered Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditLogs, searchTerm]);

  // Protect Access
  if (currentUser.role !== UserRole.AUDITOR) {
    return <div className="p-10 text-center text-red-500 font-bold">Acesso Negado. Área restrita à Auditoria.</div>;
  }

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 text-slate-300">
              <ShieldAlert size={24} className="text-red-500" />
              <span className="uppercase tracking-widest text-sm font-black">Central de Auditoria André</span>
            </div>
            <h1 className="text-4xl font-black font-serif mb-2">Monitoramento de Integridade</h1>
            <p className="text-slate-400 max-w-2xl font-medium">
              Acompanhamento em tempo real de exclusões de funcionários e movimentações financeiras.
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-600">
                <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser.avatarSeed}`} alt="" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-500 uppercase">Sessão Segura</p>
               <p className="font-black text-white">{currentUser.name}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} icon={DollarSign} label="Fluxo de Caixa" />
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={FileText} label="Histórico de Ações" />
        <TabButton active={activeTab === 'login'} onClick={() => setActiveTab('login')} icon={Clock} label="Controle de Ponto" />
        <TabButton active={activeTab === 'closures'} onClick={() => setActiveTab('closures')} icon={CheckCircle2} label="Fechamentos" />
      </div>

      {/* Audit Search Bar */}
      {(activeTab === 'logs' || activeTab === 'financial') && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar na trilha de auditoria..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900/5 font-medium outline-none"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        
        {/* FINANCIAL TRAIL (INCLUSÃO/EXCLUSÃO DE VALORES) */}
        {activeTab === 'financial' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 font-serif flex items-center gap-3">
                <DollarSign className="text-emerald-600" />
                Trilha de Auditoria Financeira
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">Toda movimentação de caixa</span>
            </div>

            <div className="space-y-4">
              {financialTrail.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-slate-200 transition-all gap-4 group">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${item.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {item.type === 'ENTRADA' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.source === 'VENDA' ? 'bg-emerald-500 text-white' : item.source === 'AJUSTE' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
                          {item.source}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                          <Calendar size={10} /> {formatDateTime(item.date)}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{item.description}</h4>
                      <p className="text-sm text-gray-500 font-medium">Operador: <span className="text-slate-900 font-bold">{item.performedBy}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${item.type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'ENTRADA' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              {financialTrail.length === 0 && (
                <div className="text-center py-20 text-gray-400 font-black">Nenhuma movimentação financeira registrada.</div>
              )}
            </div>
          </div>
        )}

        {/* LOGS DE EXCLUSÃO E ALTERAÇÕES */}
        {activeTab === 'logs' && (
          <div className="p-8">
            <h3 className="text-2xl font-black text-slate-900 font-serif mb-8 flex items-center gap-3">
              <ShieldAlert className="text-red-600" />
              Histórico de Alterações Críticas
            </h3>
            <div className="space-y-4">
              {filteredAuditLogs.map(log => {
                const isDeletion = log.action.includes('EXCLUÍDO');
                return (
                  <div key={log.id} className={`flex gap-6 p-6 rounded-3xl border transition-all ${isDeletion ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="mt-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDeletion ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-slate-800 text-white'}`}>
                        {isDeletion ? <UserMinus size={24} /> : <FileText size={24} />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isDeletion ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-white px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
                          <Clock size={10} /> {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className={`text-lg font-black ${isDeletion ? 'text-red-900' : 'text-slate-900'}`}>{log.description}</p>
                      <p className="text-sm text-gray-500 font-bold mt-2 uppercase tracking-wide">
                        Autor da Ação: <span className="text-slate-900 underline decoration-2 decoration-slate-200">{log.performedBy}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredAuditLogs.length === 0 && (
                <div className="text-center py-20 text-gray-400 font-black">Nenhuma ação crítica encontrada na busca.</div>
              )}
            </div>
          </div>
        )}

        {/* CONTROLE DE PONTO */}
        {activeTab === 'login' && (
          <div className="p-8">
            <h3 className="text-2xl font-black text-slate-900 font-serif mb-8 flex items-center gap-3">
              <UserCheck className="text-blue-600" />
              Registro de Acesso da Equipe (Ponto)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Data e Horário Exato</th>
                    <th className="px-6 py-4">Funcionário</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loginLogs.map(log => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-5 text-slate-600 font-black text-sm">
                        {formatDateTime(log.loginTime)}
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                               <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${log.userName}`} alt="" />
                            </div>
                            <span className="font-black text-slate-900">{log.userName}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                          log.role === UserRole.OWNER ? 'bg-amber-100 text-amber-800' :
                          log.role === UserRole.AUDITOR ? 'bg-slate-200 text-slate-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> Autenticado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FECHAMENTOS DE CAIXA */}
        {activeTab === 'closures' && (
          <div className="p-8">
            <h3 className="text-2xl font-black text-slate-900 font-serif mb-8 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600" />
              Auditoria de Fechamentos de Caixa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {closures.map(closure => (
                <div key={closure.id} className="border-2 border-gray-100 rounded-[32px] p-6 hover:border-slate-900 transition-all group">
                   <div className="flex justify-between items-start mb-6">
                     <div>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">DATA DO FECHAMENTO</span>
                       <h4 className="text-xl font-black text-slate-900">{new Date(closure.date).toLocaleDateString()}</h4>
                       <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-tighter">Responsável: {closure.closedBy}</p>
                     </div>
                     <div className="text-right">
                       <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">TOTAL LÍQUIDO</span>
                       <p className="text-3xl font-black text-emerald-600">R$ {closure.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Vendas</span>
                         <span className="text-lg font-black text-slate-900">{closure.salesCount}</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Atendimentos</span>
                         <span className="text-lg font-black text-slate-900">{closure.attendancesCount}</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                         <Clock size={14} /> {new Date(closure.date).toLocaleTimeString()}
                      </div>
                      <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${closure.adjustmentsTotal < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                         Ajustes: R$ {closure.adjustmentsTotal.toFixed(2)}
                      </div>
                   </div>
                </div>
              ))}
              {closures.length === 0 && (
                <div className="col-span-2 text-center py-20 text-gray-400 font-black">Nenhum fechamento de caixa para auditar.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 px-8 py-4 rounded-[20px] font-black transition-all whitespace-nowrap border-2
      ${active 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 border-slate-900 scale-[1.02]' 
        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-50'}
    `}
  >
    <Icon size={20} className={active ? 'text-emerald-400' : 'text-gray-400'} />
    <span className="tracking-tight uppercase text-xs">{label}</span>
  </button>
);
