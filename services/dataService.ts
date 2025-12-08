import { db } from './firebase';
import { 
    collection, 
    doc, 
    onSnapshot, 
    updateDoc, 
    addDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    setDoc,
    getDocs,
    writeBatch
} from "firebase/firestore";
import { DayItinerary, Expense, ItineraryItem } from '../types';

// Hardcoded Trip ID for this demo (Shared Room)
const TRIP_ID = 'seoul_trip_demo_v1';

// Initial Seed Data (Used if database is empty)
const SEED_ITINERARY: DayItinerary[] = [
    {
      id: 'day1',
      date: '2024-10-15',
      weather: { temp: 18, condition: 'Sunny', icon: 'sun' },
      items: [
        { 
          id: '1', 
          time: '10:00', 
          activity: '仁川機場抵達 ✈️', 
          location: 'Incheon International Airport', 
          lat: 37.4601908, 
          lng: 126.4406957,
          completed: true 
        },
        { 
          id: '2', 
          time: '13:00', 
          activity: '飯店 Check-in (弘大)', 
          location: 'Mercure Ambassador Seoul Hongdae', 
          lat: 37.5559, 
          lng: 126.9212,
          completed: false 
        },
        { 
          id: '3', 
          time: '18:00', 
          activity: '明洞吃晚餐 & 換錢', 
          location: 'Myeongdong Night Market', 
          lat: 37.5609, 
          lng: 126.9859,
          completed: false 
        },
      ]
    },
    {
      id: 'day2',
      date: '2024-10-16',
      weather: { temp: 16, condition: 'Cloudy', icon: 'cloud' },
      items: [
        { 
          id: '4', 
          time: '09:00', 
          activity: '景福宮穿韓服 🎎', 
          location: 'Gyeongbokgung Palace', 
          lat: 37.5796, 
          lng: 126.9770,
          completed: false 
        },
        { 
          id: '5', 
          time: '12:00', 
          activity: '土俗村參雞湯', 
          location: 'Tosokchon Samgyetang', 
          lat: 37.5779, 
          lng: 126.9718,
          completed: false 
        },
      ]
    },
    {
      id: 'day3',
      date: '2024-10-17',
      weather: { temp: 14, condition: 'Rain', icon: 'rain' },
      items: [
        { 
          id: '7', 
          time: '11:00', 
          activity: 'COEX 星空圖書館', 
          location: 'Starfield Library', 
          lat: 37.5101, 
          lng: 127.0591,
          completed: false 
        },
      ]
    }
];

const SEED_EXPENSES: Expense[] = [
    {
      id: 'e1',
      payerId: 'm1',
      amount: 45000,
      description: '機場快線車票',
      date: '2024-10-15T10:30:00',
      involvedMemberIds: ['m1', 'm2', 'm3']
    },
    {
      id: 'e2',
      payerId: 'm2',
      amount: 80000,
      description: '第一晚烤肉晚餐',
      date: '2024-10-15T19:30:00',
      involvedMemberIds: ['m1', 'm2', 'm3']
    }
];

// --- Subscriptions ---

export const subscribeToItinerary = (callback: (data: DayItinerary[]) => void) => {
    if (!db) return () => {};
    
    const tripRef = doc(db, 'trips', TRIP_ID);
    const daysCollection = collection(tripRef, 'days');
    // Using a simple query. In real apps you might order by date field.
    const q = query(daysCollection);

    return onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            // Seed data if empty
            console.log("Database empty, seeding data...");
            const batch = writeBatch(db);
            SEED_ITINERARY.forEach(day => {
                const docRef = doc(daysCollection, day.id);
                batch.set(docRef, day);
            });
            await batch.commit();
            // Snapshot will fire again after commit
        } else {
            const days = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DayItinerary));
            // Sort by date locally
            days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            callback(days);
        }
    });
};

export const subscribeToExpenses = (callback: (data: Expense[]) => void) => {
    if (!db) return () => {};

    const tripRef = doc(db, 'trips', TRIP_ID);
    const expCollection = collection(tripRef, 'expenses');
    const q = query(expCollection, orderBy('date', 'desc'));

    return onSnapshot(q, async (snapshot) => {
         if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
             // Check if we really should seed (maybe user deleted all expenses?)
             // For demo simplicity, we only seed if we seeded itinerary recently or first run
             // Let's just seed if completely empty for this demo
             const batch = writeBatch(db);
             SEED_EXPENSES.forEach(exp => {
                 const docRef = doc(expCollection, exp.id);
                 batch.set(docRef, exp);
             });
             await batch.commit();
         } else {
             const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
             callback(expenses);
         }
    });
};

// --- Actions: Itinerary ---

export const updateDayItems = async (dayId: string, items: ItineraryItem[]) => {
    if (!db) return;
    const dayRef = doc(db, 'trips', TRIP_ID, 'days', dayId);
    await updateDoc(dayRef, { items });
};

export const addNewDay = async (date: string) => {
    if (!db) return;
    const newDay: DayItinerary = {
        id: Date.now().toString(),
        date: date,
        items: [],
        weather: { temp: 20, condition: 'Cloudy', icon: 'cloud' } // Mock default weather
    };
    const dayRef = doc(db, 'trips', TRIP_ID, 'days', newDay.id);
    await setDoc(dayRef, newDay);
};

// --- Actions: Expenses ---

export const addExpense = async (expense: Expense) => {
    if (!db) return;
    const expenseRef = doc(db, 'trips', TRIP_ID, 'expenses', expense.id);
    await setDoc(expenseRef, expense);
};

export const deleteExpense = async (expenseId: string) => {
    if (!db) return;
    const expenseRef = doc(db, 'trips', TRIP_ID, 'expenses', expenseId);
    await deleteDoc(expenseRef);
};
