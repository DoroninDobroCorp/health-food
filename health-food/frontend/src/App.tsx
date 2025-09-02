import { useState } from 'react';
import Header from './components/Layout/Header';
import PlannerTab from './components/Planner/PlannerTab';
import RemindersTab from './components/Reminders/RemindersTab';
import ProfileTab from './components/Profile/ProfileTab';
import RecipeModal from './components/UI/RecipeModal';
import { AIPhotoModal } from './components/Generator/AIPhotoModal';
import { useAppSelector } from './store/hooks';
import AuthPage from './components/Auth/AuthPage';
import Modal from './components/UI/Modal';

export type Tab = 'plan' | 'rem' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const isAuthenticated = useAppSelector(state => state.app.isAuthenticated);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlannerTab />;
      case 'rem':
        return <RemindersTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <section className="tab-content active" id={`tab-${activeTab}`}>
          {renderTabContent()}
        </section>
      </main>
      <RecipeModal />
      <AIPhotoModal />
      
      <Modal isOpen={!isAuthenticated} onClose={() => {}} zIndex={100}>
          <AuthPage />
      </Modal>
    </div>
  )
}

export default App
