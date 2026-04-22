import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Discovery from './pages/Discovery';
import KitchenTable from './pages/KitchenTable';
import Connections from './pages/Connections';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Promise from './pages/Promise';
import ProfileView from './pages/ProfileView';
import { NotificationProvider } from './lib/notificationContext';


function App() {
  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Promise />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/kitchen-table" element={<KitchenTable />} />
          <Route path="/kitchen-table/:matchId" element={<KitchenTable />} />
          <Route path="/messages" element={<Connections />} />
          <Route path="/messages/:chatId" element={<Messages />} />
          <Route path="/profile/:id" element={<ProfileView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/promise" element={<Promise />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}


export default App;
