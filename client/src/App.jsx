import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from './components/Sidebar';
// import ClientLevel from './pages/ClientsLevelScreen';
// import ClientDetails from './pages/ClientDetailScreen';
import ClientLevel from './pages/CLS1';
import ClientDetails from './pages/CDS';
import AddClient from './pages/AddClient';
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [category, setCategory] = useState("ECOMMERCE");

  return (
    <Router>
      <div className="flex min-h-screen h-screen bg-[#0f1116] text-white">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} setCategory={setCategory} />
        <main className="flex-1 p-6 pt-20 h-screen overflow-y-auto bg-[#0b0b0f]">
          <div className="md:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-2xl px-3 py-2 rounded bg-[#1a1d24] text-white"
            >
              ☰
            </button>
          </div>
          <Routes>
            <Route path="/" element={<></>} />
            <Route path="/client-level" element={<ClientLevel category={category} />} />
            <Route path="/client/:clientId/:category" element={<ClientDetails />} />
            <Route path="/add-client" element={<AddClient />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

