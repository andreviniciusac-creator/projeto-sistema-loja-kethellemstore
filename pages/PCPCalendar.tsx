import React, { useState, useMemo } from 'react';
import { PCPTask, PCPTaskCategory, User, UserRole } from '../types';
import { storageService } from '../services/storage.ts';
import { 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Truck, 
  Search, 
  Wrench, 
  Video, 
  GlassWater, 
  CheckCircle,
  MoreHorizontal,
  Box,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

interface PCPCalendarProps {
  currentUser: User;
}

const WEEK_DAYS = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' }
];

export const PCPCalendar: React.FC<PCPCalendarProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<PCPTask[]>(storageService.getPCPTasks());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PCPTask | null>(null);

  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    title: '',
    description: '',
    category: 'OUTROS' as PCPTaskCategory,
    time: ''
  });

  const getCategoryIcon = (cat: PCPTaskCategory) => {
    switch(cat) {
      case 'LOGISTICA': return <Truck className="text-blue-600" />;
      case 'CONFERENCIA': return <Search className="text-orange-600" />;
      case 'MANUTENCAO': return <Wrench className="text-slate-600" />;
      case 'PRODUCAO': return <Video className="text-purple-600" />;
      case 'EVENTO': return <GlassWater className="text-primary-600" />;
      case 'MARKETING': return <Box className="text-emerald-600" />;
      default: return <MoreHorizontal className="text-gray-400" />;
    }
  };

  const getCategoryColor = (cat: PCPTaskCategory) => {
    switch(cat) {
      case 'LOGISTICA': return 'bg-blue-50 border-blue-100';
      case 'CONFERENCIA': return 'bg-orange-50 border-orange-100';
      case 'MANUTENCAO': return 'bg-slate-50 border-slate-100';
      case 'PRODUCAO': return 'bg-purple-50 border-purple-100';
      case 'EVENTO': return 'bg-primary-50 border-primary-100';
      case 'MARKETING': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, completed: !task.completed };
      storageService.savePCPTask(updatedTask);
      setTasks(storageService.getPCPTasks());
    }
  };

  const handleSave = () => {
    if (!formData.title) return alert("Dê um título para a tarefa.");

    const taskToSave: PCPTask = {
      id: editingTask?.id || Date.now().toString(),
      dayOfWeek: formData.dayOfWeek,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      completed: editingTask?.completed || false,
      time: formData.time
    };

    storageService.savePCPTask(taskToSave);
    setTasks(storageService.getPCPTasks());
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ dayOfWeek: 1, title: '', description: '', category: 'OUTROS', time: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja remover esta tarefa do cronograma?")) {
      storageService.deletePCPTask(id);
      setTasks(storageService.getPCPTasks());
    }
  };

  const handleEdit = (task: PCPTask) => {
    setEditingTask(task);
    setFormData({
      dayOfWeek: task.dayOfWeek,
      title: task.title,
      description: task.description,
      category: task.category,
      time: task.time || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 font-serif">PCP - Cronograma de Lançamento</h2>
          <p className="text-gray-500 font-medium italic">Sincronia perfeita entre a chegada da mercadoria e o trabalho de terceiros.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTask(null);
            setFormData({ dayOfWeek: 1, title: '', description: '', category: 'LOGISTICA', time: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-[20px] hover:bg-black transition-all shadow-xl font-bold"
        >
          <Plus size={20} />
          <span>Agendar Lançamento</span>
        </button>
      </div>

      {/* Weekly Board View */}
      <div className="flex flex-col xl:flex-row gap-6 overflow-x-auto pb-8 no-scrollbar scroll-smooth">
        {WEEK_DAYS.filter(d => d.id !== 0 && d.id !== 6).concat(WEEK_DAYS.filter(d => d.id === 6 || d.id === 0)).map(day => {
          const dayTasks = tasks.filter(t => t.dayOfWeek === day.id);
          const isToday = new Date().getDay() === day.id;

          return (
            <div key={day.id} className={`flex-shrink-0 w-full sm:w-80 md:w-96 xl:w-72 min-h-[400px] flex flex-col gap-4`}>
               <div className={`p-4 rounded-[24px] border-2 flex items-center justify-between ${isToday ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-900 shadow-sm'}`}>
                  <h3 className="font-black uppercase text-xs tracking-widest">{day.label}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                    {dayTasks.length} tarefas
                  </span>
               </div>

               <div className="flex-1 space-y-4">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`relative group p-6 rounded-[32px] border-2 transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer ${task.completed ? 'opacity-60 grayscale' : ''} ${getCategoryColor(task.category)}`}
                      onClick={() => handleEdit(task)}
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                             {getCategoryIcon(task.category)}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(task.id);
                            }}
                            className={`p-2 rounded-xl transition-all ${task.completed ? 'bg-emerald-500 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}
                          >
                             <CheckCircle2 size={20} />
                          </button>
                       </div>

                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{task.category}</span>
                          {task.time && (
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock size={10}/> {task.time}</span>
                          )}
                       </div>

                       <h4 className={`text-lg font-black leading-tight mb-2 ${task.completed ? 'line-through' : 'text-gray-900'}`}>{task.title}</h4>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2">{task.description}</p>

                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDelete(task.id);
                         }}
                         className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  ))}

                  <button 
                    onClick={() => {
                      setEditingTask(null);
                      setFormData({ ...formData, dayOfWeek: day.id });
                      setIsModalOpen(true);
                    }}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[32px] flex items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all group"
                  >
                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                  </button>
               </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 font-serif">
                {editingTask ? 'Editar Tarefa' : 'Agendar PCP'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dia da Semana</label>
                  <select 
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                    value={formData.dayOfWeek}
                    onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                  >
                    {WEEK_DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Horário (Opcional)</label>
                  <input 
                    type="time"
                    className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoria da Operação</label>
                <div className="grid grid-cols-3 gap-2">
                   {(['LOGISTICA', 'CONFERENCIA', 'MANUTENCAO', 'PRODUCAO', 'EVENTO', 'MARKETING'] as PCPTaskCategory[]).map(cat => (
                     <button 
                       key={cat}
                       onClick={() => setFormData({...formData, category: cat})}
                       className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${formData.category === cat ? 'bg-slate-900 border-slate-900 text-white' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">O que será feito?</label>
                <input 
                  type="text" 
                  placeholder="Ex: Chegada do Fardo de SP"
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detalhes Estratégicos</label>
                <textarea 
                  rows={3}
                  placeholder="Instruções para a equipe ou terceiros..."
                  className="w-full border-2 border-gray-50 rounded-2xl p-4 font-bold bg-gray-50 focus:bg-white focus:border-primary-500 transition-all outline-none resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-[0.98]"
                >
                  Confirmar Cronograma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};