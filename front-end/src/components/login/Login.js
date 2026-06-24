import React from 'react';
import styles from '../css/Login.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLoginSuccess }){

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha })
    });

    if (response.ok) {
      const dados = await response.json();
      
      // 💾 Salva no localStorage (converte o boolean para string)
      localStorage.setItem('isAdmin', dados.admin);
      localStorage.setItem('isLogged', 'true');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      // Redireciona para o painel principal
      navigate('/home');
    } else {
      alert('Usuário ou senha incorretos!');
    }
  };



  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1>Login</h1>

        <div className={styles.loginForm}>
        <p1><p1 className={styles.loginText}>Usuario</p1></p1>
        <input 
          type="text" 
          className={styles.loginInput} 
          placeholder="Coloque seu usuario" 
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        /> 

         <p1><p1 className={styles.loginText}>Senha</p1></p1>
        <input 
          type="password" 
          className={styles.loginInput} 
          placeholder="Coloque sua senha" 
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        /> 

        </div>
        <div className={styles.loginButtonContainer}>
          <button onClick={handleLogin} className={styles.loginButton}>Entrar</button>
        </div>
      </div>
    </div>
  );
}


export default Login;