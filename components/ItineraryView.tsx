import React, { useState, useEffect } from 'react';
import { DayItinerary, ItineraryItem } from '../types';
import { updateDayItems, addNewDay } from '../services/dataService';
import { Plus, Trash2, MapPin, Clock, Check, Circle, Cloud, Sun, CloudRain, Map as MapIcon, List, Navigation } from 'lucide-react';

interface ItineraryViewProps {
  itinerary: DayItinerary[];
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ itinerary }) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  
  // Initialize selected day when itinerary loads
  useEffect(() => {
      if (itinerary.length > 0 && !selectedDayId) {
          setSelectedDayId(itinerary[0].id);
      } else if (itinerary.length > 0 && !itinerary.find(d => d.id === selectedDayId)) {
           // If selected day was deleted or invalid, reset to first
          setSelectedDayId(itinerary[0].id);
      }
  }, [itinerary, selectedDayId]);

  // Modal Form State
  const [formState, setFormState] = useState<{
    time: string;
    activity: string;
    location: string;
  }>({
    time: '10:00',
    activity: '',
    location: ''
  });

  const currentDay = itinerary.find(d => d.id === selectedDayId);
  const sortedItems = currentDay?.items.sort((a, b) => a.time.localeCompare(b.time)) || [];

  // Weather Icon Helper
  const getWeatherIcon = (condition?: string) => {
    switch (condition) {
      case 'Sunny': return <Sun className="text-orange-400" size={24} />;
      case 'Rain': return <CloudRain className="text-blue-400" size={24} />;
      default: return <Cloud className="text-gray-400" size={24} />;
    }
  };

  const openModal = (item?: ItineraryItem) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        time: item.time,
        activity: item.activity,
        location: item.location
      });
    } else {
      setEditingItem(null);
      setFormState({ time: '10:00', activity: '', location: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formState.activity || !selectedDayId || !currentDay) return;

    let newItems = [...currentDay.items];
    
    if (editingItem) {
        newItems = newItems.map(item => 
        item.id === editingItem.id 
            ? { ...item, ...formState } 
            : item
        );
    } else {
        const newItem: ItineraryItem = {
        id: Date.now().toString(),
        time: formState.time,
        activity: formState.activity,
        location: formState.location,
        completed: false
        };
        newItems.push(newItem);
    }

    // Optimistic update locally? No, let's rely on Firestore subscription for simplicity and truth
    setIsModalOpen(false);
    await updateDayItems(selectedDayId, newItems);
  };

  const toggleComplete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentDay) return;

    const newItems = currentDay.items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateDayItems(currentDay.id, newItems);
  };

  const deleteItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!window.confirm('確定要刪除這個行程嗎？') || !currentDay) return;
    
    const newItems = currentDay.items.filter(item => item.id !== itemId);
    
    // Close modal if deleting from modal
    if (isModalOpen) setIsModalOpen(false);
    
    await updateDayItems(currentDay.id, newItems);
  };

  const handleAddDay = async () => {
    const lastDate = itinerary.length > 0 
        ? new Date(itinerary[itinerary.length - 1].date) 
        : new Date();
    
    if (itinerary.length > 0) {
        lastDate.setDate(lastDate.getDate() + 1);
    }
    
    const dateStr = lastDate.toISOString().split('T')[0];
    await addNewDay(dateStr);
    // Note: We don't manually select the new day here because we need to wait for the ID from Firestore or the local generation logic.
    // For simplicity, user can click the new day when it appears.
  };

  const openGoogleMapsRoute = () => {
    if (!sortedItems || sortedItems.length === 0) return;
    
    // Construct Google Maps URL with waypoints
    const baseUrl = "https://www.google.com/maps/dir/?api=1";
    
    // Filter items with location
    const validItems = sortedItems.filter(item => item.location);
    if (validItems.length === 0) return;

    const origin = encodeURIComponent(validItems[0].location);
    const destination = encodeURIComponent(validItems[validItems.length - 1].location);
    
    let waypoints = "";
    if (validItems.length > 2) {
        waypoints = "&waypoints=" + validItems.slice(1, -1).map(i => encodeURIComponent(i.location)).join("|");
    }

    const url = `${baseUrl}&origin=${origin}&destination=${destination}${waypoints}&travelmode=transit`;
    window.open(url, '_blank');
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekday = weekdays[date.getDay()];
    return { month, day, weekday };
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 page-transition">
      {/* Top Bar */}
      <div className="bg-cream-50 pt-6 pb-2 px-6 sticky top-0 z-10 border-b border-cream-100/50">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-cream-900">首爾之旅</h1>
            <p className="text-sm text-cream-500 font-medium tracking-wide">SEOUL, SOUTH KOREA</p>
          </div>
          <div className="flex items-center gap-2">
             {/* Toggle List/Map */}
             <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                className="bg-white p-2 rounded-xl shadow-sm border border-cream-200 text-cream-800 active:scale-95 transition-all"
             >
                {viewMode === 'list' ? <MapIcon size={20} /> : <List size={20} />}
             </button>
             {currentDay?.weather && (
                <div className="flex items-center bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-cream-100">
                {getWeatherIcon(currentDay.weather.condition)}
                <div className="ml-2 text-right">
                    <span className="block text-sm font-bold text-gray-700">{currentDay.weather.temp}°C</span>
                </div>
                </div>
            )}
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex overflow-x-auto no-scrollbar space-x-3 pb-2">
          {itinerary.map((day) => {
             const { month, day: d, weekday } = formatDateDisplay(day.date);
             const isSelected = selectedDayId === day.id;
             return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-[2rem] transition-all duration-300 ${
                  isSelected
                    ? 'bg-cream-800 text-white shadow-lg transform -translate-y-1'
                    : 'bg-white text-gray-400 border border-cream-100'
                }`}
              >
                <span className="text-[10px] font-medium opacity-80">{weekday}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{d}</span>
                <span className="text-[10px] opacity-60">{month}月</span>
              </button>
            );
          })}
          
          <button 
            onClick={handleAddDay}
            className="flex-shrink-0 w-14 h-20 rounded-[2rem] border-2 border-dashed border-cream-200 text-cream-500 flex items-center justify-center hover:bg-cream-100"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
          
        {/* LIST VIEW */}
        <div className={`absolute inset-0 overflow-y-auto px-5 py-4 space-y-4 pb-24 transition-all duration-300 ${viewMode === 'list' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
            {(!currentDay || sortedItems.length === 0) && (
                <div className="flex flex-col items-center justify-center h-64 text-cream-500 opacity-60">
                    <div className="w-16 h-16 bg-cream-200 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="text-cream-500" />
                    </div>
                    <p>{!currentDay ? "請選擇或新增一天" : "今天還沒有安排行程"}</p>
                    <button onClick={() => openModal()} className="mt-4 text-cream-800 font-bold border-b border-cream-800">
                    開始規劃
                    </button>
                </div>
            )}

            {sortedItems.map((item, index) => (
            <div 
                key={item.id} 
                onClick={() => openModal(item)}
                className={`relative bg-white p-5 rounded-[2rem] shadow-sm border border-cream-50 transition-all active:scale-[0.98] ${
                    item.completed ? 'opacity-50 grayscale' : ''
                }`}
            >
                {/* Timeline Connector */}
                {index !== sortedItems.length - 1 && (
                    <div className="absolute left-[29px] top-16 bottom-[-20px] w-[2px] bg-cream-100 -z-10"></div>
                )}

                <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mb-2 ${item.completed ? 'bg-gray-300' : 'bg-cream-800'}`}></div>
                        <span className="text-xs font-bold text-gray-500 font-mono">{item.time}</span>
                </div>

                <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className={`font-bold text-gray-800 text-lg leading-tight mb-1 ${item.completed ? 'line-through decoration-gray-400' : ''}`}>
                                {item.activity}
                            </h3>
                            <button 
                                onClick={(e) => toggleComplete(item.id, e)}
                                className={`p-1 rounded-full ${item.completed ? 'text-green-500 bg-green-50' : 'text-gray-200 hover:text-gray-400'}`}
                            >
                                {item.completed ? <Check size={20} /> : <Circle size={20} />}
                            </button>
                        </div>
                        
                        {item.location && (
                            <div className="flex items-center mt-2">
                                <span className="flex items-center text-xs text-cream-500 bg-cream-100 px-3 py-1.5 rounded-full">
                                    <MapPin size={12} className="mr-1.5" />
                                    {item.location}
                                </span>
                            </div>
                        )}
                </div>
                </div>
            </div>
            ))}
        </div>

        {/* MAP VIEW */}
        <div className={`absolute inset-0 flex flex-col bg-cream-50 transition-all duration-300 ${viewMode === 'map' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
            <div className="px-5 py-2">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-cream-100 flex items-center justify-between">
                    <div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">今日行程導航</span>
                        <div className="font-bold text-cream-900 text-sm mt-0.5">共 {sortedItems.filter(i => i.location).length} 個地點</div>
                    </div>
                    <button 
                        onClick={openGoogleMapsRoute}
                        className="bg-cream-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
                    >
                        <Navigation size={14} />
                        開啟導航
                    </button>
                </div>
            </div>
            
            <div className="flex-1 px-5 pb-24 overflow-y-auto space-y-4">
                 {/* Current User Location Simulation */}
                 <div className="flex items-center justify-center py-2">
                    <div className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full flex items-center shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        我的位置 (模擬中)
                    </div>
                 </div>

                 {sortedItems.filter(i => i.location).map((item, index) => (
                     <div key={item.id} className="relative">
                        {/* Map Card */}
                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-cream-100">
                             {/* Map Iframe for visual representation */}
                            <div className="h-32 w-full bg-gray-100 relative">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    style={{border:0, opacity: 0.8, filter: 'grayscale(20%) sepia(10%)'}}
                                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3162.123!2d${item.lng || 126.9780}!3d${item.lat || 37.5665}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${item.lat}!4v1620000000000`}
                                    allowFullScreen
                                    title={item.location}
                                ></iframe>
                                {/* Overlay to prevent interaction in list view */}
                                <div className="absolute inset-0 bg-transparent" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, '_blank')}></div>
                            </div>
                            
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cream-800 text-white flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400">{item.time}</div>
                                        <div className="font-bold text-gray-800">{item.location}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, '_blank')}
                                    className="w-10 h-10 rounded-full bg-cream-50 flex items-center justify-center text-cream-600"
                                >
                                    <Navigation size={18} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Connecting Line */}
                        {index < sortedItems.filter(i => i.location).length - 1 && (
                            <div className="w-1 h-6 bg-cream-200 mx-auto my-1 rounded-full"></div>
                        )}
                     </div>
                 ))}
            </div>
        </div>

      </div>

      {/* Floating Add Button (Only in List Mode) */}
      <button
        onClick={() => {
            if (viewMode === 'map') setViewMode('list');
            openModal();
        }}
        className={`absolute bottom-24 right-6 w-14 h-14 bg-cream-900 text-white rounded-full shadow-xl shadow-cream-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all z-20 ${viewMode === 'map' ? 'scale-0' : 'scale-100'}`}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-8 shadow-2xl animate-slide-up relative z-10">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>
            
            <h2 className="text-2xl font-bold mb-6 text-cream-900">
                {editingItem ? '編輯行程' : '新增行程'}
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">時間</label>
                    <div className="bg-cream-50 rounded-2xl p-3 flex items-center">
                        <Clock size={18} className="text-cream-500 mr-2"/>
                        <input
                        type="time"
                        value={formState.time}
                        onChange={(e) => setFormState({ ...formState, time: e.target.value })}
                        className="bg-transparent w-full outline-none font-bold text-gray-700 text-sm"
                        />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">地點 (導航用)</label>
                    <div className="bg-cream-50 rounded-2xl p-3 flex items-center">
                        <MapPin size={18} className="text-cream-500 mr-2"/>
                        <input
                            type="text"
                            placeholder="輸入地點..."
                            value={formState.location}
                            onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                            className="bg-transparent w-full outline-none text-gray-700 text-sm placeholder-gray-400"
                        />
                    </div>
                  </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">活動內容</label>
                <input
                  type="text"
                  placeholder="例：在弘大逛街、吃烤肉..."
                  value={formState.activity}
                  onChange={(e) => setFormState({ ...formState, activity: e.target.value })}
                  className="w-full bg-cream-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-cream-300 text-lg font-bold text-gray-800 placeholder-gray-300 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              {editingItem && (
                  <button
                    onClick={(e) => deleteItem(editingItem.id, e)}
                    className="p-4 rounded-2xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-cream-100 text-cream-800 font-bold hover:bg-cream-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-[2] py-4 rounded-2xl bg-cream-900 text-white font-bold shadow-lg shadow-cream-200 hover:bg-black transition-all transform active:scale-[0.98]"
              >
                {editingItem ? '儲存變更' : '加入行程'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryView;