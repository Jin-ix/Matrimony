import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Discovery from './pages/Discovery';
import KitchenTable from './pages/KitchenTable';
import Messages from './pages/Messages';
import Settings from './pages/Settings';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/discovery" element={<Discovery />} />
        <Route path="/kitchen-table/:matchId" element={<KitchenTable />} />
        <Route path="/messages/:chatId" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}


export default App;
