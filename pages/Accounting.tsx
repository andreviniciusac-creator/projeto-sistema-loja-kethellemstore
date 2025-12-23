import React, { useState, useEffect } from 'react';
import { User, Purchase } from '../types';
import { storageService } from '../services/storage.ts';
import { accountingService, AccountingSettings } from '../services/accounting.ts';
import { xmlParser } from '../services/xmlParser.ts';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Download, 
  Building, 
  Calendar,
  DollarSign,
  FileText,
  Settings2,
  TrendingDown,
  TrendingUp,
  PieChart
} from 'lucide-react';

interface AccountingProps {
  currentUser: User;
}

export const Accounting: React.FC<AccountingProps> = ({ currentUser }) => {
  const [purchases, setPurchases] = useState<Purchase[]>(storageService.getPurchases());
  // Defaulting to Jan 2025 to show the mock data automatically
  const [selectedMonth, setSelectedMonth] = useState(0); 
  const [selectedYear, setSelectedYear] = useState(2025);
  const [settings, setSettings] = useState<AccountingSettings>(accountingService.getDefaultSettings());
  const [importFeedback, setImportFeedback] = useState<{status: 'success' | 'error', msg: string} | null>(null);

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = [2024, 2025];

  const dre = accountingService.calculateDRE(selectedMonth, selectedYear, {
    sales: storageService.getSales(),
    expenses: storageService.getServiceOrders(),
    products: storageService.getProducts()
  });

  const handleExport = () => {
    accountingService.exportMonthlyClosing(selectedMonth, selectedYear, {
      sales: storageService.getSales(),
      expenses: storageService.getServiceOrders(),
      inventory: storageService.getProducts(),
      users: storageService.getUsers()
    });
    alert(`Fechamento de ${months[selectedMonth]} exportado com sucesso!`);
  };

  const updateSetting = (key: keyof AccountingSettings, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    const newSettings = { ...settings, [key]: numValue / 100 };
    setSettings(newSettings);
    accountingService.saveSettings(newSettings);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const purchaseData = xmlParser.parseNFe(content);
        storageService.savePurchase(purchaseData as Purchase);
        setPurchases(storageService.getPurchases());
        setImportFeedback({ status: 'success', msg: `Nota importada com sucesso!` });
      } catch (err: any) {
        setImportFeedback({ status: 'error', msg: err.message });
      }
    };
    reader.readAsText(file);
  };

  const getPercentage = (value: number) => {
    if (dre.revenue <= 0) return 0;
    return Math.min(100, (value / dre.revenue) * 100);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-serif">Gestão Contábil</h2>
          <p className="text-gray-500 font-medium italic">Análise de Lucro e Fechamento (DRE e Exportação XLS).</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 border border-amber-200">
             <AlertCircle size={14} /> REGIME: LUCRO PRESUMIDO (ACRE)
          </div>
        </div>
      </div>

      {/* DRE Real-Time Panel */}
      <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <PieChart size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Demonstrativo de Resultado (DRE)</span>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-3xl font-black font-serif">{months[selectedMonth]}</h3>
                <div className="bg-white/10 p-1.5 rounded-xl flex gap-1">
                  {years.map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${selectedYear === y ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}>{y}</button>
                  ))}
                </div>
              </div>
            </div>
            <select 
              className="bg-white/10 border-none rounded-xl p-3 text-sm font-black text-white outline-none cursor-pointer"
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => <option key={m} value={i} className="text-slate-900">{m}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <DRECard label="Faturamento Bruto" value={dre.revenue} type="revenue" />
            <DRECard label="CMV (Markup 100%)" value={dre.cmv} type="cost" />
            <DRECard label="Impostos + Despesas" value={dre.taxes + dre.expenses + dre.mdr} type="expense" />
            <DRECard label="Lucro Líquido Final" value={dre.netProfit} type="profit" />
          </div>

          {dre.revenue > 0 ? (
            <div className="mt-12 space-y-6">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Apropriação do Faturamento</h4>
              <div className="h-5 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${getPercentage(dre.cmv)}%` }} className="bg-blue-500 h-full border-r border-white/10" title="CMV" />
                <div style={{ width: `${getPercentage(dre.taxes)}%` }} className="bg-amber-500 h-full border-r border-white/10" title="Impostos" />
                <div style={{ width: `${getPercentage(dre.mdr)}%` }} className="bg-purple-500 h-full border-r border-white/10" title="Taxas Cartão" />
                <div style={{ width: `${getPercentage(dre.expenses)}%` }} className="bg-red-500 h-full border-r border-white/10" title="Despesas" />
                <div style={{ width: `${Math.max(0, getPercentage(dre.netProfit))}%` }} className="bg-emerald-500 h-full" title="Lucro" />
              </div>
              <div className="flex flex-wrap gap-6">
                <LegendItem color="bg-blue-500" label={`CMV: ${getPercentage(dre.cmv).toFixed(1)}%`} />
                <LegendItem color="bg-amber-500" label={`Impostos: ${getPercentage(dre.taxes).toFixed(1)}%`} />
                <LegendItem color="bg-purple-500" label={`Taxas: ${getPercentage(dre.mdr).toFixed(1)}%`} />
                <LegendItem color="bg-red-500" label={`Despesas: ${getPercentage(dre.expenses).toFixed(1)}%`} />
                <LegendItem color="bg-emerald-500" label={`Lucro: ${getPercentage(dre.netProfit).toFixed(1)}%`} />
              </div>
            </div>
          ) : (
            <div className="mt-12 p-10 border-2 border-dashed border-white/10 rounded-[32px] text-center">
              <p className="text-slate-500 font-black uppercase tracking-widest">Sem vendas registradas em {months[selectedMonth]} de {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Export & XML Section */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-2xl"><FileSpreadsheet size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900 font-serif">Exportação Mensal</h3>
               </div>
            </div>
            <button onClick={handleExport} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              <Download size={24} /> Exportar Planilha para o Contador (XLS)
            </button>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-2xl"><UploadCloud size={24} /></div>
                <h3 className="text-xl font-black text-slate-900 font-serif">Importar NF-e de Compra</h3>
             </div>
             <label className="border-4 border-dashed border-gray-50 rounded-[40px] flex flex-col items-center justify-center p-12 hover:border-primary-100 hover:bg-primary-50/30 transition-all cursor-pointer group">
                <input type="file" className="hidden" accept=".xml" onChange={handleFileUpload} />
                <FileText size={48} className="text-gray-200 group-hover:text-primary-400 mb-4 transition-colors" />
                <p className="text-slate-900 font-black">Selecionar arquivo XML (.xml)</p>
                <p className="text-xs text-gray-400 font-bold uppercase mt-2 tracking-tighter text-center">Importe as notas de fornecedores de SP/Acre para controle de CMV</p>
             </label>
             {importFeedback && (
               <div className={`mt-6 p-4 rounded-2xl font-bold text-sm text-center ${importFeedback.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {importFeedback.msg}
               </div>
             )}
          </div>
        </div>

        {/* Accounting Settings */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
           <div className="flex items-center gap-4 mb-8">
              <div className="bg-slate-100 text-slate-600 p-3 rounded-2xl"><Settings2 size={24} /></div>
              <h3 className="text-xl font-black text-slate-900 font-serif">Parâmetros Acre</h3>
           </div>
           
           <div className="space-y-6 flex-1">
              <RateInput label="Alíquota Lucro Presumido" value={settings.taxRate * 100} onChange={v => updateSetting('taxRate', v)} />
              <RateInput label="Taxa PIX (MDR)" value={settings.mdrPix * 100} onChange={v => updateSetting('mdrPix', v)} />
              <RateInput label="Taxa Cartão Média" value={settings.mdrCard * 100} onChange={v => updateSetting('mdrCard', v)} />
              
              <div className="pt-6 border-t border-gray-50 mt-auto">
                 <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                    <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />
                    <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">Configurações para cálculo de lucro líquido real. Use os valores negociados com seu banco.</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const DRECard = ({ label, value, type }: { label: string, value: number, type: 'revenue' | 'cost' | 'expense' | 'profit' }) => (
  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      {type === 'revenue' || type === 'profit' ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
    </div>
    <p className={`text-2xl font-black ${type === 'profit' && value > 0 ? 'text-emerald-400' : type === 'profit' && value < 0 ? 'text-red-400' : 'text-white'}`}>
      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
);

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{label}</span>
  </div>
);

const RateInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    <div className="relative">
      <input 
        type="number" 
        step="0.01"
        className="w-full bg-gray-50 border-none rounded-xl p-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-300">%</span>
    </div>
  </div>
);