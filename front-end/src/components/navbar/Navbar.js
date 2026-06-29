import React from 'react';
import styles from '../css/Navbar.module.css';
import { Link } from "react-router-dom";
import minhaImagem from '../images/logo.png';
import ModalDarSaida from './ModalDarSaida'; // Importa o modal que criamos acima[
import { useState } from 'react';

function Navbar() {
  const [modalAberto, setModalAberto] = useState(false);

  const aoConcluirSaida = () => {
    // Se você estiver na página de listagem de saídas ou estoque, 
    // pode disparar um recarregamento aqui. Ex: window.location.reload();
    // Ou simplesmente deixa o Polling automático de 30s atualizar as telas.
    if (window.location.pathname.includes('saidas')) {
        window.location.reload(); 
    }
  };
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogout = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      // 💾 Salva no localStorage (converte o boolean para string)
      localStorage.setItem('isLogged', 'false');
      window.location.reload();
    } else {
      alert('Erro ao sair!');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>       
        <img src={minhaImagem}/>
      </div>

<div className={styles.links}>

    <Link className={styles.link} to="/home">Início</Link>



    <div className={styles.dropdown}>
        <Link className={styles.link} to="/estoque">Estoque</Link>
    </div>


    <div className={styles.dropdown}>
        <span >Saidas</span>
        <div className={styles.submenu}>
            <Link className={styles.submenutext} to="/saidas">Visualizar</Link>
            <p className={styles.submenutext} onClick={() => setModalAberto(true)} >Dar Saída</p>
            <ModalDarSaida 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        aoSucesso={aoConcluirSaida}
      />
        </div>
    </div>
    
    {isAdmin && (
               <div className={styles.dropdown}>
        <span>Pedidos</span>
        <div className={styles.submenu}>
                        {/* 🔐 Links exclusivos do ADMIN usando renderização condicional */}
            
                <Link className={styles.submenutext} to="/entrada">Dar entrada</Link>
              <Link className={styles.submenutext} to="/pedidos">Visualizar</Link>
        </div>
    </div>
            )
            }
      
    


</div>
      <div className={styles.saida}>       
        <Link onClick={handleLogout} className={styles.link} to="/logout">Sair</Link>
      </div>
    </nav>
  );
}


export default Navbar;