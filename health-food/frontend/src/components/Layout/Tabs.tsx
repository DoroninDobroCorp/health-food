import type { Dispatch, SetStateAction } from "react";
import type { Tab } from "../../App";

interface TabsProps {
    activeTab: Tab;
    setActiveTab: Dispatch<SetStateAction<Tab>>;
}

const Tabs = ({ activeTab, setActiveTab }: TabsProps) => {
    const tabs: { id: Tab; icon: string; name: string }[] = [
        { id: 'plan', icon: '🍲', name: 'План питания' },
        { id: 'restaurants', icon: '📍', name: 'Заведения рядом' },
        { id: 'subs', icon: '📦', name: 'Подписка' },
        { id: 'reviews', icon: '💬', name: 'Отзывы' },
        { id: 'rem', icon: '🔔', name: 'Напоминания' },
        { id: 'profile', icon: '👤', name: 'Профиль' },
    ];

    return (
        <nav className="nav-tabs">
            {tabs.map(tab => (
                 <button 
                    key={tab.id}
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`} 
                    onClick={() => setActiveTab(tab.id)}
                >
                    <span className="tab-icon">{tab.icon}</span> {tab.name}
                </button>
            ))}
        </nav>
    );
};

export default Tabs; 