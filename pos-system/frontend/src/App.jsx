import { useState, useEffect } from 'react';
import DashboardMenu from './components/DashboardMenu';
import PosTerminal from './components/PosTerminal';
import CashRegister from './components/CashRegister';
import InventoryManager from './components/InventoryManager';
import PromotionsManager from './components/PromotionsManager';
import CashMovementsManager from './components/CashMovementsManager';
import CommissionsManager from './components/CommissionsManager';
import WebOrdersManager from './components/WebOrdersManager';
import SettingsManager from './components/SettingsManager';
import SalesHistory from './components/SalesHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginScreen from './components/LoginScreen';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('DASHBOARD');

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F1' && currentUser) {
        e.preventDefault();
        setCurrentView('POS');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentUser]);

  // Si no hay sesión iniciada, mostrar pantalla de Login
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView(user.role === 'ADMIN' ? 'DASHBOARD' : 'POS');
        }}
      />
    );
  }

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  return (
    <>
      {currentView === 'DASHBOARD' && (
        <DashboardMenu 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onNavigate={(view) => setCurrentView(view)} 
        />
      )}

      {currentView === 'POS' && (
        <PosTerminal 
          currentUser={currentUser}
          onLogout={handleLogout}
          onBackToMenu={() => setCurrentView(currentUser.role === 'ADMIN' ? 'DASHBOARD' : 'POS')} 
        />
      )}

      {currentView === 'CASH_REGISTER' && (
        <CashRegister onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'INVENTORY' && (
        <InventoryManager 
          currentUser={currentUser}
          onBackToMenu={() => setCurrentView('DASHBOARD')} 
        />
      )}

      {currentView === 'PROMOTIONS' && (
        <PromotionsManager onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'CASH_MOVEMENTS' && (
        <CashMovementsManager onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'COMMISSIONS' && (
        <CommissionsManager onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'WEB_ORDERS' && (
        <WebOrdersManager onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'SETTINGS' && (
        <SettingsManager onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'SALES_HISTORY' && (
        <SalesHistory onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}

      {currentView === 'ANALYTICS' && (
        <AnalyticsDashboard onBackToMenu={() => setCurrentView('DASHBOARD')} />
      )}
    </>
  );
}

export default App;