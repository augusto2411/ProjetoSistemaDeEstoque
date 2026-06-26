import React, { useState, useEffect } from 'react';
import styles from '../css/Estoque.module.css';

function Estoque() {
  const [telas, setTelas] = useState([]);
  const [marcas, setMarcas] = useState([]); 
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [modoCriacao, setModoCriacao] = useState(false); 
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  // 1. ESTADO PARA O CAMPO DE PESQUISA
  const [pesquisa, setPesquisa] = useState('');

  // Estado para a linha de Edição
  const [dadosEditados, setDadosEditados] = useState({
    modelo: '',
    quantidade: 0,
    com_aro: false,
    valor_atacado: 0,
    valor_varejo: 0
  });

  // Estado para a linha de Criação de nova tela
  const [novaTela, setNovaTela] = useState({
    marca_id: '', 
    modelo: '',
    quantidade: 0,
    com_aro: false,
    valor_atacado: 0,
    valor_varejo: 0
  });

  const carregarDados = async () => {
    try {
      const resTelas = await fetch('/api/telas');
      const dadosTelas = await resTelas.json();
      setTelas(dadosTelas);

      const resMarcas = await fetch('/api/marcas');
      const dadosMarcas = await resMarcas.json();
      setMarcas(dadosMarcas);

      if (dadosMarcas.length > 0) {
        setNovaTela(prev => ({ ...prev, marca_id: dadosMarcas[0].id }));
      }
    } catch (erro) {
      console.error("Erro ao carregar dados do estoque:", erro);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

useEffect(() => {
    // 1. Carrega os dados assim que o usuário entra na página
    carregarDados();

    // 2. Cria um cronômetro para rodar o 'carregarDados' a cada 30 segundos
    const intervalo = setInterval(() => {
      // Só atualiza se o usuário não estiver editando nada para não perder o que digitou
      if (idEmEdicao === null && !modoCriacao) {
        console.log("Polling: Atualizando estoque automaticamente...");
        carregarDados();
      }
    }, 30000); // 30000 milissegundos = 30 segundos

    // 3. FUNÇÃO DE LIMPEZA (Garantia do React)
    // Se o usuário sair da página de Estoque, desliga o cronômetro para não gastar memória
    return () => clearInterval(intervalo);
  }, [idEmEdicao, modoCriacao]); // Adicionamos esses estados aqui para o useEffect saber quando o usuário está digitando

  // --- FUNÇÕES DE CADASTRO, EDIÇÃO E EXCLUSÃO (MANTIDAS IGUAIS) ---
  const handleCriarTela = async () => {
    try {
      const resposta = await fetch('/api/telas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaTela)
      });
      if (resposta.ok) {
        setModoCriacao(false); 
        setNovaTela({ marca_id: marcas[0]?.id || '', modelo: '', quantidade: 0, com_aro: false, valor_atacado: 0, valor_varejo: 0 }); 
        carregarDados(); 
      }
    } catch (erro) {
      console.error("Erro ao criar tela:", erro);
    }
  };

  const iniciarEdicao = (tela) => {
    setIdEmEdicao(tela.id);
    setDadosEditados({
      modelo: tela.modelo,
      quantidade: tela.quantidade,
      com_aro: tela.com_aro,
      valor_atacado: tela.valor_atacado,
      valor_varejo: tela.valor_varejo
    });
  };

  const salvarEdicao = async (id) => {
    try {
      const resposta = await fetch(`/api/telas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEditados)
      });
      if (resposta.ok) {
        setIdEmEdicao(null);
        carregarDados();
      }
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }
  };

  const excluirTela = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta tela?")) {
      try {
        const resposta = await fetch(`/api/telas/${id}`, {
          method: 'DELETE'
        });
        if (resposta.ok) {
          carregarDados();
        }
      } catch (erro) {
        console.error("Erro ao excluir:", erro);
      }
    }
  };

  // =================================================================
  // 2. LÓGICA DE FILTRO E ORDENAÇÃO (Roda automaticamente a cada render)
  // =================================================================
  
  // Primeiro, filtramos as telas pelo que o usuário digitou no campo de pesquisa
  const telasFiltradas = telas.filter(tela => 
    tela.modelo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // Depois, ordenamos as telas filtradas: Primeiro por Marca, depois por Modelo (A-Z)
  const telasOrdenadasEFiltradas = telasFiltradas.sort((a, b) => {
    // Compara as marcas (ex: "Samsung" vs "Apple")
    const comparacaoMarca = a.marca.localeCompare(b.marca);
    
    // Se as marcas forem diferentes, já ordena por elas
    if (comparacaoMarca !== 0) {
      return comparacaoMarca;
    }
    
    // Se a marca for a mesma (ex: ambas Samsung), desempatamos pelo Modelo (A-Z)
    return a.modelo.localeCompare(b.modelo);
  });

  return (
    <div className={styles.estoqueContainer}>
      <div className={styles.estoqueBox}>
        
        {/* Topo da tabela com Botão e Barra de Pesquisa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <input 
            
            type="text"
            placeholder="Pesquisar por modelo..."
            className={styles.inputTexto}
            style={{ width: '40%', padding: '8px 12px' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
          {isAdmin && (
                <button 
            className={`${styles.btn} ${styles.btnSalvar}`} 
            onClick={() => setModoCriacao(true)}
            disabled={modoCriacao}
          >
            + Adicionar Nova Tela
          </button>
            )
            }
          

          {/* 3. CAMPO DE PESQUISA */}

        </div>

        <table className={styles.tabela}>
          <thead>
            <tr>

              <th>Marca</th>
              <th>Modelo</th>
              <th>Qtd</th>
              <th>Aro</th>
              <th>Atacado</th>
              <th>Varejo</th>
              {isAdmin && (
              <th>Ações</th>
            )
            }

            </tr>
          </thead>
          <tbody>
            
            {/* LINHA DE CRIAÇÃO */}
            {modoCriacao && (
              <tr style={{ backgroundColor: '#fff3cd' }}>

                <td>
                  <select 
                    className={styles.inputSelect}
                    value={novaTela.marca_id}
                    onChange={(e) => setNovaTela({...novaTela, marca_id: parseInt(e.target.value)})}
                  >
                    {marcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input 
                    className={styles.inputTexto}
                    type="text" 
                    placeholder="Modelo"
                    value={novaTela.modelo}
                    onChange={(e) => setNovaTela({...novaTela, modelo: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    className={styles.inputNumero}
                    type="number" 
                    value={novaTela.quantidade}
                    onChange={(e) => setNovaTela({...novaTela, quantidade: parseInt(e.target.value)})}
                  />
                </td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={novaTela.com_aro}
                    onChange={(e) => setNovaTela({...novaTela, com_aro: e.target.checked})}
                  />
                </td>
                <td>
                  <input 
                    className={styles.inputNumero}
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={novaTela.valor_atacado || ''}
                    onChange={(e) => setNovaTela({...novaTela, valor_atacado: e.target.value})}
                  />
                </td>
                <td>
                  <input 
                    className={styles.inputNumero}
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={novaTela.valor_varejo || ''}
                    onChange={(e) => setNovaTela({...novaTela, valor_varejo: e.target.value})}
                  />
                </td>
                <td>
                  <button className={`${styles.btn} ${styles.btnSalvar}`} onClick={handleCriarTela}>Confirmar</button>
                  <button className={`${styles.btn} ${styles.btnCancelar}`} onClick={() => setModoCriacao(false)}>Cancelar</button>
                </td>
              </tr>
            )}

            {/* 4. EXIBINDO A LISTA FILTRADA E ORDENADA */}
            {telasOrdenadasEFiltradas.map((tela) => (
              <tr key={tela.id}>
                <td>{tela.marca}</td>
                
                {idEmEdicao === tela.id ? (
                  <>
                    {/* MODO EDIÇÃO */}
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
                      <input 
                        type="checkbox" 
                        checked={dadosEditados.com_aro} 
                        onChange={(e) => setDadosEditados({...dadosEditados, com_aro: e.target.checked})} 
                      />
                    </td>
                    <td>
                      <input 
                        className={styles.inputNumero}
                        type="number" 
                        step="0.01" 
                        value={dadosEditados.valor_atacado} 
                        onChange={(e) => setDadosEditados({...dadosEditados, valor_atacado: e.target.value})} 
                      />
                    </td>
                    <td>
                      <input 
                        className={styles.inputNumero}
                        type="number" 
                        step="0.01" 
                        value={dadosEditados.valor_varejo} 
                        onChange={(e) => setDadosEditados({...dadosEditados, valor_varejo: e.target.value})} 
                      />
                    </td>
                    <td>
                      <button className={`${styles.btn} ${styles.btnSalvar}`} onClick={() => salvarEdicao(tela.id)}>Salvar</button>
                      <button className={`${styles.btn} ${styles.btnCancelar}`} onClick={() => setIdEmEdicao(null)}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* MODO VISUALIZAÇÃO */}
                    <td>{tela.modelo}</td>
                    <td>{tela.quantidade}</td>
                    <td>{tela.com_aro ? 'Com aro' : 'Sem aro'}</td>
                    <td>R$ {tela.valor_atacado.toFixed(2)}</td>
                    <td>R$ {tela.valor_varejo.toFixed(2)}</td>
                    
                    {isAdmin && (
                       <td>
                      <button className={`${styles.btn} ${styles.btnEditar}`} onClick={() => iniciarEdicao(tela)}>Editar</button>
                      <button className={`${styles.btn} ${styles.btnExcluir}`} onClick={() => excluirTela(tela.id)}>Excluir</button>
                    </td>
            )
            }  
                  </>
                )}
              </tr>
            ))}

            {/* Aviso caso a pesquisa não encontre nada */}
            {telasOrdenadasEFiltradas.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhuma tela encontrada para "{pesquisa}"
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Estoque;