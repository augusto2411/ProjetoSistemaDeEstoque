import React, { useState, useEffect } from 'react';
import styles from '../css/VisualizarSaidas.module.css';
import Swal from 'sweetalert2';

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
Swal.fire({
  title: 'Erro ao Salvar',
  text: erro.erro || "Não foi possível processar a alteração.",
  icon: 'error',
  confirmButtonColor: '#000', // Mantendo o padrão dos seus botões
  didOpen: () => {
    // Garante que o modal de erro fique por cima de tudo
    Swal.getContainer().style.zIndex = "3000";
  }
});
      }
    } catch (erro) {
      console.error("Erro ao salvar edição:", erro);
    }
  };

  const excluirSaida = async (id) => {
  // 1. Abre o modal de confirmação com aviso sobre a restauração do estoque
  const resultadoConfirmacao = await Swal.fire({
    title: 'Excluir Saída?',
    html: 'Tem certeza que deseja excluir esta linha?<br><br><b>Nota:</b> O estoque original deste item será restaurado automaticamente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33', // Vermelho para ação de exclusão
    cancelButtonColor: '#000',  // Preto para cancelar
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      // Mantém o modal acima de qualquer outra camada visual
      Swal.getContainer().style.zIndex = "3000";
    }
  });

  // Se o usuário confirmou a ação
  if (resultadoConfirmacao.isConfirmed) {
    try {
      const resposta = await fetch(`/api/saidas/${id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        // Alerta de sucesso
        Swal.fire({
          title: 'Excluído!',
          text: 'A saída foi removida e o estoque foi restaurado.',
          icon: 'success',
          confirmButtonColor: '#28a745',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        
        carregarSaidas(); // Atualiza a tabela de saídas
      } else {
        const erro = await resposta.json();
        // Alerta se o back-end rejeitar a requisição
        Swal.fire({
          title: 'Erro ao Excluir',
          text: erro.erro || "Não foi possível processar a exclusão.",
          icon: 'error',
          confirmButtonColor: '#000',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
      }
    } catch (erro) {
      console.error("Erro ao excluir saída:", erro);
      // Alerta de erro de rede / conexão
      Swal.fire({
        title: 'Erro Crítico',
        text: 'Falha na comunicação com o servidor.',
        icon: 'error',
        confirmButtonColor: '#000',
        didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
      });
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
  Swal.fire({
    title: 'Lista Vazia',
    text: 'Não há nenhuma tela na lista de saídas para gerar um pedido!',
    icon: 'info',
    confirmButtonColor: '#000', // Mantém o padrão preto dos seus botões
    didOpen: () => {
      // Garante que o modal fique por cima de qualquer outra camada da tela
      Swal.getContainer().style.zIndex = "3000";
    }
  });
  return;
}

  // 2. Pede a confirmação do usuário
const resultadoConfirmacao = await Swal.fire({
  title: 'Fechar Pedido?',
  html: 'Deseja realmente fechar este pedido?<br><br><b>Atenção:</b> Isso irá salvar todas as telas atuais em um novo histórico de pedidos e limpará esta tabela de saídas.',
  icon: 'question',
  showCancelButton: true,
  confirmButtonColor: '#28a745', // Verde para confirmar o fechamento
  cancelButtonColor: '#000',    // Preto para cancelar/voltar
  confirmButtonText: 'Sim, fechar pedido',
  cancelButtonText: 'Voltar',
  didOpen: () => {
    Swal.getContainer().style.zIndex = "3000"; // Mantém acima de qualquer modal
  }
});

// Se o usuário clicar em Cancelar ou fechar o modal, ele para a execução aqui
if (!resultadoConfirmacao.isConfirmed) return;
// --- ATÉ AQUI ---
try {
    const resposta = await fetch('/api/pedidos/fechar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saidas: saidas }) // envia os dados atuais se necessário
    });

    if (resposta.ok) {
      // CAPTURA O ARQUIVO BINÁRIO (BLOB) DO EXCEL
      const blob = await resposta.blob();
      
      // Cria um link invisível no navegador para forçar o download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedido_telas_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Limpa o link da memória
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: 'Pedido Gerado!',
        text: 'O arquivo Excel foi baixado e a lista de saídas foi resetada com sucesso.',
        icon: 'success',
        confirmButtonColor: '#28a745',
        didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
      });

      carregarSaidas(); // Recarrega a tabela limpa
    } else {
      // Caso dê algum erro antes de gerar o arquivo
      const erro = await resposta.json();
      Swal.fire({
        title: 'Erro ao Gerar Pedido',
        text: erro.erro || "Não foi possível criar o arquivo de Excel.",
        icon: 'error',
        confirmButtonColor: '#000',
        didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
      });
    }
  } catch (erro) {
    console.error("Erro ao fechar pedido:", erro);
    Swal.fire({
      title: 'Erro de Conexão',
      text: 'Falha de comunicação com o servidor ao gerar o Excel.',
      icon: 'error',
      confirmButtonColor: '#000',
      didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
    });
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