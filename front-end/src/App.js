import './App.css';
import Home from './components/home/Home';
import Navbar from './components/navbar/Navbar';
import { Routes, Route, Navigate } from 'react-router-dom'; // Removido o BrowserRouter daqui
import Login from './components/login/Login';
import { useState } from 'react'; // 1. Importe o useState
import Estoque from './components/estoque/Estoque'; // Importe o componente Estoque
import VisualizarSaidas from './components/saidas/VisualizarSaidas'; // Importe o componente VisualizarSaidas
import VisualizarPedidos from './components/pedidos/VisualizarPedidos'; // Importe o componente VisualizarPedidos
import DarEntrada from './components/pedidos/DarEntrada'; // Importe o componente DarEntrada

function RotaAdmin({ children }) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isLogged = localStorage.getItem('isLogged') === 'true';

  if (!isLogged) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;

  return children;
}

export function RotaProtegida({ children }) {
  const isLogged = localStorage.getItem('isLogged') === 'true';

  if (!isLogged) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RotaPublica({ children }) {
  const isLogged = localStorage.getItem('isLogged') === 'true';

  // Se JÁ estiver logado, não deixa ver o login e manda para a home
  if (isLogged) {
    return <Navigate to="/home" replace />;
  }

  // Se não estiver logado, deixa ver a tela de login normalmente
  return children;
}

function App() {
  const [logado, setLogado] = useState(localStorage.getItem('isLogged') === 'true');
  const atualizarLogin = () => {
    setLogado(true);
  };

  return (
    <> {/* 🌟 Usamos um Fragment do React (<>) no lugar do BrowserRouter */}
      {logado && <Navbar />}      
      <Routes>
        {/* 🔓 Rota Pública, mas que chuta quem já está logado */}
        <Route 
          path="/login" 
          element={
            <RotaPublica>
              <Login onLoginSuccess={atualizarLogin} />
            </RotaPublica>
          } 
        />
        
        {/* 🔒 Rotas Protegidas */}
        <Route 
          path="/estoque" 
          element={
            <RotaProtegida>
              <Estoque />
            </RotaProtegida>
          } 
          
        />
        <Route 
          path="/saidas" 
          element={
            <RotaProtegida>
              <VisualizarSaidas />
            </RotaProtegida>
          } 
          
        />
        {/* 🔐 Rota Super Protegida */}
        <Route 
          path="/pedidos" 
          element={
            <RotaAdmin>
              <VisualizarPedidos />
            </RotaAdmin>
          } 
        />
        <Route 
          path="/entrada" 
          element={
            <RotaAdmin>
              <DarEntrada />
            </RotaAdmin>
          } 
        />

        {/* Rota padrão */}
        <Route path="*" element={<Navigate to="/estoque" replace />} />
      </Routes>
    </>
  );
}

export default App;