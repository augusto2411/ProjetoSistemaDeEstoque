import React from 'react';
import styles from '../css/Navbar.module.css';
import { Link } from "react-router-dom";
import minhaImagem from '../images/logo.png';

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>       
        <img src={minhaImagem}/>
      </div>

<div className={styles.links}>

    <Link className={styles.link} to="/">Início</Link>


    <div className={styles.dropdown}>
        <span>Estoque</span>
        <div className={styles.submenu}>
            <Link className={styles.submenutext} to="/estoque">Visualizar</Link>
            <Link className={styles.submenutext} to="/estoque/editar">Editar</Link>
        </div>
    </div>


    <div className={styles.dropdown}>
        <span >Saidas</span>
        <div className={styles.submenu}>
            <Link className={styles.submenutext} to="/saidas/saidas">Visualizar</Link>
            <Link className={styles.submenutext} to="/saidas/darsaida">Dar saida</Link>
        </div>
    </div>

    <div className={styles.dropdown}>
        <span>Pedidos</span>
        <div className={styles.submenu}>
            <Link className={styles.submenutext} to="/pedidos/pedidos">Visualizar</Link>
            <Link className={styles.submenutext} to="/pedidos/entrada">Dar entrada</Link>
        </div>
    </div>


</div>
      <div className={styles.saida}>       
        <Link className={styles.link} to="/logout">Sair</Link>
      </div>
    </nav>
  );
}


export default Navbar;