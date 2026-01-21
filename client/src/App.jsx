import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/q/:id" element={<Layout><JoinQueue /></Layout>} />
      <Route path="/q/:id/status" element={<Layout><QueueStatus /></Layout>} />
      <Route path="/admin/:id" element={<Layout><AdminDashboard /></Layout>} />
    </Routes>
  );
}

export default App;
