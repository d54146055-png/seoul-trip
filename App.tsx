import React, { useState, useEffect } from 'react';
import { Tab, DayItinerary, Member, Expense } from './types';
import ItineraryView from './components/ItineraryView';
import ExpenseView from './components/ExpenseView';
import AiGuideView from './components/AiGuideView';
import { Calendar, Wallet, Sparkles } from 'lucide-react';
import { subscribeToItinerary, subscribeToExpenses } from './services/dataService';
import { db } from './services/firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ITINERARY);
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Members are hardcoded for this demo, in a real app these would be synced too
  const [members] = useState<Member[]>([
    { id: 'm1', name: '我', avatarColor: 'bg-cream-800' },
    { id: 'm2', name: 'Sarah', avatarColor: 'bg-orange-300' },
    { id: 'm3', name: 'John', avatarColor: 'bg-blue-300' },
  ]);

  useEffect(() => {
    // If DB is not configured, we might want to show a warning, 
    // but the service handles graceful degradation (returns empty/mock seeds if implemented locally, 
    // but here we rely on the service to trigger callbacks).
    
    if (!db) {
        alert("請在 services/firebase.ts 設定您的 Firebase Config 以啟用同步功能！");
        return;
    }

    const unsubscribeItinerary = subscribeToItinerary((data) => {
        setItinerary(data);
        setIsLoading(false);
    });

    const unsubscribeExpenses = subscribeToExpenses((data) => {
        setExpenses(data);
    });

    return () => {
        unsubscribeItinerary();
        unsubscribeExpenses();
    };
  }, []);

  if (isLoading && db) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-cream-50 text-cream-900">
              <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-cream-800 rounded-full animate-ping mb-4"></div>
                  <p className="font-bold text-sm tracking-widest">載入行程中...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex justify-center items-start font-sans">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md h-[100dvh] bg-cream-50 shadow-2xl relative overflow-hidden flex flex-col sm:border-x sm:border-cream-200">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === Tab.ITINERARY && (
            <ItineraryView itinerary={itinerary} />
          )}
          {activeTab === Tab.EXPENSES && (
            <ExpenseView members={members} expenses={expenses} />
          )}
          {activeTab === Tab.AI_GUIDE && (
            <AiGuideView />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="h-[84px] bg-white border-t border-cream-100 flex justify-around items-start pt-3 pb-6 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => setActiveTab(Tab.ITINERARY)}
            className={`flex flex-col items-center justify-center w-20 transition-all ${
              activeTab === Tab.ITINERARY ? 'text-cream-900' : 'text-cream-300 hover:text-cream-400'
            }`}
          >
            <Calendar size={26} strokeWidth={activeTab === Tab.ITINERARY ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1.5 tracking-wide">行程</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.AI_GUIDE)}
            className={`flex flex-col items-center justify-center w-20 transition-all relative top-[-15px] group`}
          >
             <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg group-active:scale-95 ${
                 activeTab === Tab.AI_GUIDE 
                 ? 'bg-cream-900 text-white translate-y-[-2px]' 
                 : 'bg-white text-cream-300 border border-cream-100'
             }`}>
                 <Sparkles size={24} strokeWidth={2.5} fill={activeTab === Tab.AI_GUIDE ? "white" : "none"} fillOpacity={0.2}/>
             </div>
             <span className={`text-[10px] font-bold mt-1.5 tracking-wide ${activeTab === Tab.AI_GUIDE ? 'text-cream-900' : 'text-cream-300'}`}>AI導遊</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.EXPENSES)}
            className={`flex flex-col items-center justify-center w-20 transition-all ${
              activeTab === Tab.EXPENSES ? 'text-cream-900' : 'text-cream-300 hover:text-cream-400'
            }`}
          >
            <Wallet size={26} strokeWidth={activeTab === Tab.EXPENSES ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1.5 tracking-wide">分帳</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;