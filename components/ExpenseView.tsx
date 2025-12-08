import React, { useState, useMemo } from 'react';
import { Expense, Member } from '../types';
import { addExpense as addExpenseToDb, deleteExpense as deleteExpenseFromDb } from '../services/dataService';
import { Plus, DollarSign, Users, Trash2, Receipt, RefreshCw, Settings } from 'lucide-react';

interface ExpenseViewProps {
  members: Member[];
  expenses: Expense[];
}

const ExpenseView: React.FC<ExpenseViewProps> = ({ members, expenses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.024); // 1 KRW = 0.024 TWD
  const [showRateSettings, setShowRateSettings] = useState(false);
  
  const [newExpense, setNewExpense] = useState<{
    amount: string;
    description: string;
    payerId: string;
  }>({
    amount: '',
    description: '',
    payerId: members[0].id
  });

  const balances = useMemo(() => {
    const bals: Record<string, number> = {};
    members.forEach(m => bals[m.id] = 0);

    expenses.forEach(exp => {
      // Calculate split based on KRW
      const splitAmount = exp.amount / exp.involvedMemberIds.length;
      bals[exp.payerId] += exp.amount;
      exp.involvedMemberIds.forEach(mid => {
        bals[mid] -= splitAmount;
      });
    });

    return Object.entries(bals).map(([memberId, amount]) => ({
      memberId,
      amount
    }));
  }, [expenses, members]);

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return;

    const expense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      payerId: newExpense.payerId,
      involvedMemberIds: members.map(m => m.id) // Default split equally
    };

    setIsAdding(false);
    setNewExpense({ amount: '', description: '', payerId: members[0].id });
    
    // Send to Firestore
    await addExpenseToDb(expense);
  };

  const deleteExpense = async (id: string) => {
      if(window.confirm("確定要刪除這筆款項嗎？")) {
        await deleteExpenseFromDb(id);
      }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';
  const getMemberColor = (id: string) => members.find(m => m.id === id)?.avatarColor || 'bg-gray-200';

  const convertToHomeCurrency = (krw: number) => {
    return Math.round(krw * exchangeRate).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 page-transition pb-24 relative">
      {/* Header */}
      <div className="pt-6 px-6 mb-2 flex justify-between items-start">
           <div>
            <h1 className="text-2xl font-bold text-cream-900 mb-1">分帳助手</h1>
            <p className="text-sm text-cream-500">自動計算 & 匯率換算</p>
           </div>
           <button 
            onClick={() => setShowRateSettings(!showRateSettings)}
            className="p-2 bg-white rounded-full text-cream-400 hover:text-cream-800 shadow-sm border border-cream-100"
           >
             <Settings size={20} />
           </button>
      </div>

      {/* Exchange Rate Settings */}
      {showRateSettings && (
          <div className="mx-6 mb-4 bg-cream-100 p-4 rounded-2xl flex items-center justify-between animate-fadeIn">
              <span className="text-xs font-bold text-cream-600 uppercase">匯率設定 (KRW to TWD)</span>
              <div className="flex items-center bg-white rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold mr-2 text-gray-400">1 KRW =</span>
                  <input 
                    type="number" 
                    step="0.001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-16 font-bold text-cream-900 outline-none text-right"
                  />
                  <span className="text-xs font-bold ml-1 text-gray-400">TWD</span>
              </div>
          </div>
      )}

      {/* Summary Card */}
      <div className="mx-5 mt-2 bg-white p-6 rounded-[2rem] shadow-sm border border-cream-100">
        <h2 className="text-xs font-bold text-cream-500 uppercase tracking-wider mb-4 flex items-center">
            <Users size={14} className="mr-2"/> 目前結算 (約合台幣)
        </h2>
        <div className="space-y-3">
          {balances.map(b => (
            <div key={b.memberId} className="flex justify-between items-center py-1">
              <span className="font-bold text-gray-700 flex items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold text-cream-900 border border-white shadow-sm ${getMemberColor(b.memberId)} bg-opacity-40`}>
                     {getMemberName(b.memberId).charAt(0)}
                 </div>
                 {getMemberName(b.memberId)}
              </span>
              <div className="text-right">
                <span className={`block font-bold font-mono text-lg ${b.amount >= 0 ? 'text-teal-600' : 'text-rose-400'}`}>
                    {b.amount >= 0 ? '+' : ''}{convertToHomeCurrency(b.amount)}
                    <span className="text-xs ml-1 opacity-60">NTD</span>
                </span>
                <span className="text-[10px] text-gray-400">
                    ({Math.round(b.amount).toLocaleString()} ₩)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense List Header */}
      <div className="px-6 mt-6 mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-cream-500 uppercase tracking-wider">支出紀錄</span>
          <span className="text-xs text-cream-400 bg-cream-100 px-2 py-1 rounded-md">Total: {expenses.length}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {expenses.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-cream-400">
                <Receipt size={32} className="mb-2 opacity-50"/>
                <span className="text-sm">還沒有支出紀錄</span>
            </div>
        )}
        {expenses.map(expense => (
          <div key={expense.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-cream-50 flex justify-between items-center group">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-cream-900 ${getMemberColor(expense.payerId)} bg-opacity-30`}>
                        {getMemberName(expense.payerId)} 先付
                    </span>
                    <span className="text-[10px] text-gray-300">
                        {new Date(expense.date).toLocaleDateString()}
                    </span>
                </div>
                <div className="font-bold text-gray-800 text-base">{expense.description}</div>
            </div>
            <div className="flex flex-col items-end">
                <span className="font-bold text-lg text-gray-800 mb-0 font-mono tracking-tight">₩{expense.amount.toLocaleString()}</span>
                <span className="text-xs font-bold text-gray-400">≈ NT$ {convertToHomeCurrency(expense.amount)}</span>
                
                <button 
                    onClick={() => deleteExpense(expense.id)} 
                    className="absolute right-8 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all p-2 bg-white shadow-sm rounded-full translate-x-10 group-hover:translate-x-0"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>

       {/* Add Button */}
       <button
        onClick={() => setIsAdding(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-xl shadow-teal-100 flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all z-20"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-8 shadow-2xl animate-slide-up relative z-10">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mr-3">
                    <DollarSign size={20}/>
                </div>
                記一筆 (韓幣)
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">金額 (KRW)</label>
                <div className="relative">
                    <input
                    type="number"
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full bg-cream-50 rounded-2xl p-4 pl-4 outline-none focus:ring-2 focus:ring-teal-200 text-3xl font-bold text-gray-800 placeholder-gray-300 font-mono"
                    />
                    <span className="absolute right-4 top-6 text-gray-400 font-bold text-sm">₩</span>
                </div>
                {/* Real-time conversion preview */}
                {newExpense.amount && (
                    <div className="mt-2 text-right text-sm font-bold text-teal-600 flex justify-end items-center">
                        <RefreshCw size={12} className="mr-1"/>
                        約合台幣 {convertToHomeCurrency(parseFloat(newExpense.amount))} 元
                    </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">項目說明</label>
                <input
                  type="text"
                  placeholder="例：晚餐、計程車..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-cream-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-teal-200 text-base font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">誰付的錢？</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {members.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setNewExpense({...newExpense, payerId: m.id})}
                            className={`px-5 py-3 rounded-2xl text-sm font-bold border transition-all whitespace-nowrap flex items-center gap-2 ${
                                newExpense.payerId === m.id 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' 
                                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                             <div className={`w-4 h-4 rounded-full ${m.avatarColor} bg-opacity-50`}></div>
                            {m.name}
                        </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-[2] py-4 rounded-2xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-colors"
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseView;