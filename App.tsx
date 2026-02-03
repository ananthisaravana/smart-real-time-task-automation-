
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, WorldState, TaskStatus, TaskPriority } from './types';
import { INITIAL_TASKS, Icons } from './constants';
import { parseTaskFromNaturalLanguage, reprioritizeTasks } from './services/geminiService';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'success';
  timestamp: number;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [worldState, setWorldState] = useState<WorldState>({
    currentTime: new Date().toLocaleTimeString(),
    currentLocation: 'Office - Downtown',
    userActivity: 'working',
    energyLevel: 85,
    upcomingMeetings: ['Q3 Strategy Session (2pm)', 'Weekly Sync (4pm)']
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'automation'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [automationLogs, setAutomationLogs] = useState<{ id: string; msg: string; time: string; type: string }[]>([]);
  const [tick, setTick] = useState(0); 
  
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setTick(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const triggerNotification = useCallback((title: string, message: string, type: 'urgent' | 'info' | 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  }, []);

  const logAutomation = useCallback((msg: string, type: string) => {
    setAutomationLogs(prev => [
      { id: Math.random().toString(36).substr(2, 9), msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type },
      ...prev.slice(0, 4)
    ]);
  }, []);

  const checkTaskNotifications = useCallback(() => {
    const now = new Date();
    setWorldState(prev => ({ ...prev, currentTime: now.toLocaleTimeString() }));

    tasks.forEach(task => {
      if (task.status === TaskStatus.COMPLETED) return;

      const deadline = new Date(task.deadline);
      const timeDiff = deadline.getTime() - now.getTime();
      const secondsLeft = Math.floor(timeDiff / 1000);
      const minutesLeft = Math.floor(secondsLeft / 60);

      if (timeDiff < 0 && !notifiedTasks.current.has(`${task.id}-overdue`)) {
        triggerNotification('Task Overdue', `"${task.title}" missed its deadline!`, 'urgent');
        notifiedTasks.current.add(`${task.id}-overdue`);
        logAutomation(`Alert: ${task.title} is overdue.`, 'alert');
      } 
      else if (timeDiff > 0 && secondsLeft <= 10 && !notifiedTasks.current.has(`${task.id}-approaching`)) {
        triggerNotification('Immediate Reminder', `"${task.title}" is due NOW.`, 'urgent');
        notifiedTasks.current.add(`${task.id}-approaching`);
      }
    });
  }, [tasks, triggerNotification, logAutomation]);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks(INITIAL_TASKS as Task[]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
    checkTaskNotifications();
  }, [tasks, checkTaskNotifications]);

  // Updated function: Create a task using the input text + button duration
  const createTaskWithTiming = (minutes: number) => {
    if (!prompt.trim()) {
      triggerNotification('Input Required', 'Please type a task in the command box first.', 'info');
      return;
    }

    const deadline = new Date(Date.now() + minutes * 60000);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: prompt.trim(),
      description: `Scheduled via Quick ${minutes}m action.`,
      basePriority: TaskPriority.HIGH,
      dynamicPriority: TaskPriority.HIGH,
      status: TaskStatus.ACTIVE,
      deadline: deadline.toISOString(),
      triggers: [{ type: 'time', value: `${minutes}m` }],
      automations: [],
      createdAt: new Date().toISOString()
    };
    
    setTasks(prev => [newTask, ...prev]);
    setPrompt(''); // Clear input after scheduling
    triggerNotification('Task Scheduled', `"${newTask.title}" set for ${minutes} minutes from now.`, 'success');
    logAutomation(`Task scheduled with ${minutes}m timer: ${newTask.title}`, "zap");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsSyncing(true);
    try {
      const nowIso = new Date().toISOString();
      const partialTask = await parseTaskFromNaturalLanguage(prompt, nowIso);
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: partialTask.title || prompt,
        description: partialTask.description || '',
        basePriority: (partialTask.basePriority as TaskPriority) || TaskPriority.MEDIUM,
        dynamicPriority: (partialTask.basePriority as TaskPriority) || TaskPriority.MEDIUM,
        status: TaskStatus.ACTIVE,
        deadline: partialTask.deadline || new Date(Date.now() + 86400000).toISOString(),
        triggers: partialTask.triggers || [],
        automations: partialTask.automations || [],
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      setPrompt('');
      logAutomation(`AI Task Added: ${newTask.title}`, "bot");
    } catch (error) {
      console.error("Task creation failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === TaskStatus.COMPLETED ? TaskStatus.ACTIVE : TaskStatus.COMPLETED } : t
    ));
  };

  const formatCountdown = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return "Time's up!";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs.toString().padStart(2, '0')}s remaining`;
  };

  const isInputEmpty = !prompt.trim();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pb-20 px-4 md:px-0">
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-[22rem] pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto glass p-5 rounded-2xl border shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden relative ${n.type === 'urgent' ? 'border-rose-500/50 bg-rose-950/40' : n.type === 'success' ? 'border-emerald-500/50 bg-emerald-950/40' : 'border-blue-500/50 bg-slate-900/95'}`}>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <div className={`p-2 rounded-lg ${n.type === 'urgent' ? 'bg-rose-500/20 text-rose-400' : n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {n.type === 'urgent' ? <Icons.Zap /> : n.type === 'success' ? <Icons.CheckCircle /> : <Icons.Bell />}
                </div>
                <h4 className="font-bold text-base text-slate-100">{n.title}</h4>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-slate-500 hover:text-slate-300 p-1"><Icons.X /></button>
            </div>
            <p className="text-sm text-slate-300 ml-11 leading-relaxed">{n.message}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            <Icons.Zap /> NEXUS AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">Smart Real-Time Task & Automation Hub</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex flex-col text-xs pr-3 border-r border-slate-700">
            <span className="text-slate-500 uppercase tracking-tighter">Location</span>
            <span className="text-slate-200 font-medium">{worldState.currentLocation}</span>
          </div>
          <div className="flex flex-col text-xs pl-3">
            <span className="text-slate-500 uppercase tracking-tighter">Time</span>
            <span className="text-slate-200 font-medium font-mono">{worldState.currentTime}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          
          {/* Intelligence Command */}
          <div className="glass rounded-3xl p-6 relative overflow-hidden group border-blue-500/30">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-100">
               Intelligence Command
            </h2>
            <form onSubmit={addTask} className="relative mb-6">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What task would you like to schedule?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-5 pr-14 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
              />
              <button type="submit" disabled={isSyncing || isInputEmpty} className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {isSyncing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Plus />}
              </button>
            </form>

            {/* Quick Timer Bar - Now linked to the command input */}
            <div className={`transition-all duration-300 ${isInputEmpty ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80 mb-3 flex items-center gap-2">
                Set timing for the task above:
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[5, 10, 15, 20, 30, 60].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => createTaskWithTiming(mins)}
                    className="group relative overflow-hidden bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl py-2 transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    <div className="text-sm font-bold text-slate-100">{mins}m</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('all')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Active</button>
              <button onClick={() => setActiveTab('critical')} className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === 'critical' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Focus</button>
            </div>
            <button onClick={() => setIsSyncing(true)} className="text-xs font-bold text-blue-400/80 uppercase tracking-widest px-4 py-2 border border-blue-500/20 rounded-full hover:bg-blue-500/5 transition-all">AI Optimization</button>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => activeTab === 'all' || t.dynamicPriority === 'Critical' || t.dynamicPriority === 'High').map(task => {
              const diff = new Date(task.deadline).getTime() - new Date().getTime();
              const isShort = diff > 0 && diff < 3600000;
              const isOverdue = diff <= 0 && task.status !== TaskStatus.COMPLETED;
              
              return (
                <div key={task.id} className={`glass rounded-2xl p-5 border-l-4 transition-all ${task.status === TaskStatus.COMPLETED ? 'opacity-40 border-slate-700' : isOverdue ? 'border-rose-500 bg-rose-950/10' : isShort ? 'border-blue-400 animate-glow' : 'border-slate-800'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${task.dynamicPriority === 'Critical' ? 'text-rose-400' : 'text-blue-400'}`}>{task.dynamicPriority}</span>
                        {isShort && task.status !== TaskStatus.COMPLETED && (
                          <span className="text-[11px] font-mono text-blue-300 flex items-center gap-2 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                            {formatCountdown(task.deadline)}
                          </span>
                        )}
                        {isOverdue && <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Late</span>}
                      </div>
                      <h3 className={`text-lg font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                    </div>
                    <button onClick={() => toggleTaskStatus(task.id)} className={`p-3 rounded-full transition-all active:scale-90 ${task.status === TaskStatus.COMPLETED ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                      <Icons.CheckCircle />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Context Hub</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">User Activity</span>
                <span className="text-slate-200 font-medium capitalize">{worldState.userActivity}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-xs text-indigo-300 leading-relaxed italic">
                  "Type your task first, then choose a timing button to schedule it instantly."
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Activity Stream</h2>
            <div className="space-y-4">
              {automationLogs.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic">No recent activity detected.</p>
              ) : (
                automationLogs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-bottom-2">
                    <div className={`p-2 rounded-lg text-xs ${log.type === 'alert' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <Icons.Zap />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-300 leading-tight">{log.msg}</p>
                      <span className="text-[9px] text-slate-600 mt-1 block uppercase tracking-widest">{log.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
