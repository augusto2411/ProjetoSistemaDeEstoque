import React, { useState, useEffect } from 'react';
import styles from '../css/Estoque.module.css'; // Herdando seu contêiner dourado lindo

function VisualizarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoAbertoId, setPedidoAbertoId] = useState(null); 
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS'); // <-- NOVO: Estado para controlar o filtro ('TODOS', 'PENDENTE', 'CONCLUIDO')

  const carregarPedidos = async () => {
    try {
      const resposta = await fetch('/api/pedidos');
      if (resposta.ok) {
        const dados = await resposta.json();
        setPedidos(dados);
      }
    } catch (erro) {
      console.error("Erro ao carregar histórico de pedidos:", erro);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const togglePedido = (id) => {
    setPedidoAbertoId(pedidoAbertoId === id ? null : id);
  };

  // LÓGICA DE FILTRAGEM (Pesquisa + Status)
  const pedidosFiltrados = pedidos.filter(pedido => {
    // 1. Filtro por texto (Marca ou Modelo)
    const bateTexto = !pesquisa || pedido.itens.some(item => 
      item.modelo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      item.marca.toLowerCase().includes(pesquisa.toLowerCase())
    );

    // 2. Filtro por Status da Tag
    const bateStatus = filtroStatus === 'TODOS' || pedido.status === filtroStatus;

    return bateTexto && bateStatus;
  });

  return (
    <div className={styles.estoqueContainer}>
      <div className={styles.estoqueBox}>
        <h1 style={{ color: '#000', fontSize: '2rem', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          Histórico de Pedidos
        </h1>

        {/* Filtros: Barra de Pesquisa + Select de Status */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text"
            placeholder="Buscar por modelo ou marca..."
            className={styles.inputTexto}
            style={{ width: '40%', padding: '8px 12px' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          {/* NOVO: Menu para escolher qual status mostrar */}
          <select 
            className={styles.inputSelect}
            style={{ width: '200px', padding: '8px' }}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="TODOS">📋 Mostrar Todos</option>
            <option value="PENDENTE">⏳ Apenas em Aberto</option>
            <option value="CONCLUIDO">✅ Apenas Finalizados</option>
          </select>
        </div>

        {/* Lista de Pedidos estilo Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} style={{ border: '1px solid #000', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#fff' }}>
              
              {/* Barra do Pedido */}
              <div 
                onClick={() => togglePedido(pedido.id)}
                style={{
                  backgroundColor: pedidoAbertoId === pedido.id ? '#e0a307' : '#f4f4f4',
                  padding: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  color: '#000',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span>📦 PEDIDO #{pedido.id}</span>
                  
                  {/* NOVO: Tag estilizada de Status do Pedido */}
                  <span style={{
                    backgroundColor: pedido.status === 'CONCLUIDO' ? '#28a745' : '#dc3545',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    {pedido.status === 'CONCLUIDO' ? 'CONCLUÍDO' : 'EM ABERTO'}
                  </span>
                </div>

                <span>📅 DATA: {pedido.data_pedido}</span>
                <span style={{ fontSize: '1.2rem' }}>
                  {pedidoAbertoId === pedido.id ? '🔼' : '🔽'}
                </span>
              </div>

              {/* Detalhes do Pedido (Aberto) */}
              {pedidoAbertoId === pedido.id && (
                <div style={{ padding: '15px', backgroundColor: '#fff' }}>
                  <table className={styles.tabela} style={{ marginTop: '0px', boxShadow: 'none' }}>
                   <thead>
  <tr style={{ backgroundColor: '#eaeaea' }}>
    <th>MARCA</th>
    <th>MODELO</th>
    <th>ARO</th>
    <th>QTD PEDIDA</th>
    {/* Se o pedido estiver concluído, mostra a coluna do que chegou */}
    {pedido.status === 'CONCLUIDO' && <th>QTD RECEBIDA</th>}
  </tr>
</thead>
<tbody>
  {pedido.itens.map((item, index) => (
    <tr key={index}>
      <td style={{ textTransform: 'uppercase' }}>{item.marca}</td>
      <td style={{ textTransform: 'uppercase' }}>{item.modelo}</td>
      <td style={{ textTransform: 'uppercase' }}>{item.com_aro ? 'COM ARO' : 'SEM ARO'}</td>
      <td style={{ fontWeight: 'bold' }}>{item.quantidade} un</td>
      
      {/* Mostra o que veio e aplica uma cor cinza ou vermelha se veio faltando */}
      {pedido.status === 'CONCLUIDO' && (
        <td style={{ 
          fontWeight: 'bold', 
          color: item.qtd_recebida < item.quantidade ? '#dc3545' : '#28a745' 
        }}>
          {item.qtd_recebida} un {item.qtd_recebida < item.quantidade && '⚠️ (Falta)'}
        </td>
      )}
    </tr>
  ))}
</tbody>
                  </table>
                </div>
              )}

            </div>
          ))}

          {/* Aviso de lista vazia */}
          {pedidosFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', color: '#000', padding: '20px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>
              Nenhum pedido correspondente ao filtro foi encontrado.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default VisualizarPedidos;