import React, { useState, useEffect } from 'react';
import styles from '../css/VisualizarSaidas.module.css';

function VisualizarSaidas() {
  const [saidas, setSaidas] = useState([]);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [pesquisa, setPesquisa] = useState('');

  // Estado para a linha de Edição (Garante os tipos corretos para o banco)
  const [dadosEditados, setDadosEditados] = useState({
    marca: '',
    modelo: '',
    quantidade: 0,
    com_aro: false
  });

  // 1. CARREGAR DADOS DO FLASK
  const carregarSaidas = async () => {
    try {
      const resposta = await fetch('/api/saidas');
      if (resposta.ok) {
        const dados = await resposta.json();
        setSaidas(dados);
      }
    } catch (erro) {
      console.error("Erro ao carregar dados das saídas:", erro);
    }
  };

  useEffect(() => {
    carregarSaidas();
  }, []);

  // 2. FUNÇÕES DE EDIÇÃO E EXCLUSÃO
  const iniciarEdicao = (saida) => {
    setIdEmEdicao(saida.id);
    setDadosEditados({
      marca: saida.marca,
      modelo: saida.modelo,
      quantidade: saida.quantidade,
      com_aro: saida.com_aro
    });
  };

  const salvarEdicao = async (id) => {
    try {
      const resposta = await fetch(`/api/saidas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEditados)
      });
      if (resposta.ok) {
        setIdEmEdicao(null);
        carregarSaidas();
      } else {
        const erro = await resposta.json();
        alert(erro.erro || "Erro ao salvar.");
      }
    } catch (erro) {
      console.error("Erro ao salvar edição:", erro);
    }
  };

  const excluirSaida = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta linha? O estoque original será restaurado.")) {
      try {
        const resposta = await fetch(`/api/saidas/${id}`, {
          method: 'DELETE'
        });
        if (resposta.ok) {
          carregarSaidas();
        } else {
          const erro = await resposta.json();
          alert(erro.erro || "Erro ao excluir.");
        }
      } catch (erro) {
        console.error("Erro ao excluir saída:", erro);
      }
    }
  };

  // =================================================================
  // 3. LÓGICA DE FILTRO E ORDENAÇÃO (Idêntica ao Estoque)
  // =================================================================
  const saidasFiltradas = saidas.filter(saida => 
    saida.modelo.toLowerCase().includes(pesquisa.toLowerCase()) ||
    saida.marca.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const saidasOrdenadasEFiltradas = saidasFiltradas.sort((a, b) => {
    const comparacaoMarca = a.marca.localeCompare(b.marca);
    if (comparacaoMarca !== 0) {
      return comparacaoMarca;
    }
    return a.modelo.localeCompare(b.modelo);
  });

  const handleFecharPedido = async () => {
  // 1. Verifica se existem itens na tabela antes de tentar fechar
  if (saidas.length === 0) {
    alert("Não há nenhuma tela na lista de saídas para gerar um pedido!");
    return;
  }

  // 2. Pede a confirmação do usuário
  const confirmar = window.confirm(
    "Deseja realmente fechar este pedido?\n\nIsso irá salvar todas as telas atuais em um novo histórico de pedidos e limpará esta tabela de saídas."
  );

  if (!confirmar) return;

  try {
    // 3. Dispara a requisição para o Flask
    const resposta = await fetch('/api/pedidos/fechar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (resposta.ok) {
      alert("Pedido fechado com sucesso! A lista de saídas foi resetada.");
      // 4. Recarrega a tabela de saídas (que agora virá vazia do banco)
      carregarSaidas();
    } else {
      const erro = await resposta.json();
      alert(erro.erro || "Erro ao fechar o pedido.");
    }
  } catch (erro) {
    console.error("Erro ao fechar pedido:", erro);
    alert("Erro de conexão com o servidor.");
  }
};

  return (
    <div className={styles.saidasContainer}>
      <div className={styles.saidasBox}>

        {/* Topo da tabela com Barra de Pesquisa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder="Pesquisar por modelo ou marca..."
            className={styles.inputTexto}
            style={{ width: '40%', padding: '8px 12px' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
          {isAdmin && (
          <button 
            className={`${styles.btn} ${styles.btnSalvar}`} 
            onClick={handleFecharPedido}
          >
            Fazer pedido
          </button>
            )
            }
          
        </div>

        {/* Tabela de Saídas */}
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Quantidade</th>
              <th>Aro</th>
              <th>Data/Hora</th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            
            {saidasOrdenadasEFiltradas.map((saida) => (
              <tr key={saida.id}>
                
                {idEmEdicao === saida.id ? (
                  <>
                    {/* MODO EDIÇÃO INLINE */}
                    <td>{saida.marca}</td>
                    <td>
                      <input 
                        className={styles.inputTexto}
                        type="text" 
                        value={dadosEditados.modelo} 
                        onChange={(e) => setDadosEditados({...dadosEditados, modelo: e.target.value})} 
                      />
                    </td>
                    <td>
                      <input 
                        className={styles.inputNumero}
                        type="number" 
                        value={dadosEditados.quantidade} 
                        onChange={(e) => setDadosEditados({...dadosEditados, quantidade: parseInt(e.target.value)})} 
                      />
                    </td>
                    <td>
                      <td>{saida.com_aro ? 'Com aro' : 'Sem aro'}</td>
                    </td>
                    <td>{saida.data_saida}</td>
                    <td>
                      <button className={`${styles.btn} ${styles.btnSalvar}`} onClick={() => salvarEdicao(saida.id)}>Salvar</button>
                      <button className={`${styles.btn} ${styles.btnCancelar}`} onClick={() => setIdEmEdicao(null)}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* MODO VISUALIZAÇÃO */}
                    <td>{saida.marca}</td>
                    <td>{saida.modelo}</td>
                    <td style={{ fontWeight: 'bold' }}>{saida.quantidade} un</td>
                    <td>{saida.com_aro ? 'Com aro' : 'Sem aro'}</td>
                    <td style={{ color: '#555' }}>{saida.data_saida}</td>
                    
                    {isAdmin && (
                      <td>
                        <button className={`${styles.btn} ${styles.btnEditar}`} onClick={() => iniciarEdicao(saida)}>Editar</button>
                        <button className={`${styles.btn} ${styles.btnExcluir}`} onClick={() => excluirSaida(saida.id)}>Excluir</button>
                      </td>
                    )}
                  </>
                )}

              </tr>
            ))}

            {/* Aviso caso a pesquisa não encontre nada */}
            {saidasOrdenadasEFiltradas.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? "6" : "5"} style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhuma saída encontrada para "{pesquisa}"
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VisualizarSaidas;