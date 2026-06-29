import React, { useState, useEffect } from 'react';
import styles from '../css/Estoque.module.css'; // Reutiliza seu padrão visual impecável

function DarEntrada() {
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState('');
  const [itensConferidos, setItensConferidos] = useState([]); // Guarda as quantidades digitadas pelo usuário
  const [valorAtacadoAvulso, setValorAtacadoAvulso] = useState('');
  const [valorVarejoAvulso, setValorVarejoAvulso] = useState('');
  
  // NOVO: Estado para armazenar o termo de busca na tabela de conferência
  const [pesquisaItem, setPesquisaItem] = useState('');

  // Estados para o formulário de Entrada Avulsa (Tela fora do pedido)
  const [modoAvulso, setModoAvulso] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [marcaAvulsaId, setMarcaAvulsaId] = useState('');
  const [modeloAvulso, setModeloAvulso] = useState('');
  const [comAroAvulso, setComAroAvulso] = useState(false);
  const [qtdAvulsa, setQtdAvulsa] = useState('');

  // 1. CARREGA OS PEDIDOS E AS MARCAS AO ABRIR A TELA
  const buscarDadosIniciais = async () => {
    try {
      const resPedidos = await fetch('/api/pedidos');
      if (resPedidos.ok) {
        const dados = await resPedidos.json();
        const pendentes = dados.filter(p => p.status === 'PENDENTE');
        setPedidosPendentes(pendentes);
        if (pendentes.length > 0) {
          carregarPedidoParaConferencia(pendentes[0].id, pendentes);
        }
      }

      const resMarcas = await fetch('/api/marcas');
      if (resMarcas.ok) {
        const dadosM = await resMarcas.json();
        setMarcas(dadosM);
        if (dadosM.length > 0) setMarcaAvulsaId(dadosM[0].id);
      }
    } catch (err) {
      console.error("Erro ao buscar dados iniciais:", err);
    }
  };

  useEffect(() => {
    buscarDadosIniciais();
  }, []);

  // 2. MONTA A TABELA DE CONFERÊNCIA COM AS QUANTIDADES ORIGINAIS DO PEDIDO
  const carregarPedidoParaConferencia = (idPedido, listaDePedidos = pedidosPendentes) => {
    setPedidoSelecionadoId(idPedido);
    setPesquisaItem(''); // Limpa a busca ao trocar de pedido
    const pedidoObj = listaDePedidos.find(p => p.id === parseInt(idPedido));
    
    if (pedidoObj) {
      const estruturaConfererencia = pedidoObj.itens.map(item => ({
        id: item.id,
        marca: item.marca,
        modelo: item.modelo,
        com_aro: item.com_aro,
        quantidade_pedida: item.quantidade,
        qtd_recebida: item.quantidade 
      }));
      setItensConferidos(estruturaConfererencia);
    } else {
      setItensConferidos([]);
    }
  };

  // 3. ATUALIZA A QUANTIDADE DE UM ITEM DA TABELA EM TEMPO REAL
  const handleMudarQtdRecebida = (idItem, valor) => {
    const novaQtd = parseInt(valor) || 0;
    setItensConferidos(prev => 
      prev.map(item => item.id === idItem ? { ...item, qtd_recebida: novaQtd } : item)
    );
  };

  // NOVO: 3.5 LÓGICA DE FILTRAGEM EM TEMPO REAL DA TABELA
  const itensFiltrados = itensConferidos.filter(item => {
    const termo = pesquisaItem.toLowerCase();
    return (
      item.marca.toLowerCase().includes(termo) ||
      item.modelo.toLowerCase().includes(termo)
    );
  });

  // 4. SUBMETE A CONFERÊNCIA DO PEDIDO PARA O BACK-END (COM VALIDAÇÃO DE PREÇO)
  const handleConfirmarEntradaPedido = async (e) => {
    e.preventDefault();
    if (!pedidoSelecionadoId) return;

    const confirmar = window.confirm(
      "Deseja confirmar a entrada deste pedido?\n\nAs quantidades informadas serão somadas ao estoque. O que ficou em falta será jogado de volta nas Saídas."
    );
    if (!confirmar) return;

    let payload = {
      itens: itensConferidos, // ATENÇÃO: Enviamos a lista completa (itensConferidos), não a filtrada!
      confirmar_precos: false
    };

    try {
      let resposta = await fetch(`/api/pedidos/dar-entrada/${pedidoSelecionadoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let dadosResultado = await resposta.json();

      if (dadosResultado.requer_precos) {
        let novosItensComPreco = [...itensConferidos];

        for (let itemSemPreco of dadosResultado.itens_pendentes) {
          const precoAtacadoInput = window.prompt(
            `💰 A tela ${itemSemPreco.marca.toUpperCase()} ${itemSemPreco.modelo.toUpperCase()} está sem preço no estoque.\n\nDigite o PREÇO DE CUSTO / ATACADO:`
          );
          if (precoAtacadoInput === null) return; 

          const precoVarejoInput = window.prompt(
            `🏷️ Digite o PREÇO DE VENDA / VAREJO para a tela ${itemSemPreco.modelo.toUpperCase()}:`
          );
          if (precoVarejoInput === null) return;

          novosItensComPreco = novosItensComPreco.map(itemOriginal => {
            if (itemOriginal.id === itemSemPreco.id) {
              return {
                ...itemOriginal,
                preco_custo: parseFloat(precoAtacadoInput) || 0.0,
                preco_venda: parseFloat(precoVarejoInput) || 0.0
              };
            }
            return itemOriginal;
          });
        }

        payload.itens = novosItensComPreco;
        payload.confirmar_precos = true;

        resposta = await fetch(`/api/pedidos/dar-entrada/${pedidoSelecionadoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        dadosResultado = await resposta.json();
      }

      if (resposta.ok) {
        alert("Entrada de pedido processada e estoque updated com sucesso!");
        setPedidoSelecionadoId('');
        setItensConferidos([]);
        setPesquisaItem('');
        buscarDadosIniciais(); 
      } else {
        alert(dadosResultado.erro || "Erro ao processar entrada.");
      }
    } catch (err) {
      console.error("Erro na requisição de entrada:", err);
    }
  };

  // 5. ENVIA UMA ENTRADA AVULSA DIRETO PARA O ESTOQUE (FORA DE PEDIDO)
  const handleSalvarAvulso = async (e) => {
    e.preventDefault();
    const marcaObj = marcas.find(m => m.id === parseInt(marcaAvulsaId));
    const quantidade = parseInt(qtdAvulsa);
    const atacado = parseFloat(valorAtacadoAvulso) || 0;
    const varejo = parseFloat(valorVarejoAvulso) || 0;

    if (!marcaObj || !modeloAvulso.trim() || !quantidade || quantidade <= 0) {
      alert("Preencha todos os campos da entrada avulsa corretamente.");
      return;
    }

    try {
      const resposta = await fetch('/api/telas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca_id: marcaObj.id,
          modelo: modeloAvulso.toUpperCase(),
          quantidade: quantidade,
          com_aro: comAroAvulso,
          valor_atacado: atacado,   
          valor_varejo: varejo      
        })
      });

      if (resposta.ok) {
        alert("Tela avulsa integrada ao estoque com sucesso!");
        setModeloAvulso('');
        setQtdAvulsa('');
        setValorAtacadoAvulso('');
        setValorVarejoAvulso('');
        setComAroAvulso(false);
        setModoAvulso(false);
      } else {
        alert("Erro ao salvar entrada avulsa.");
      }
    } catch (err) {
      console.error("Erro ao enviar avulso:", err);
    }
  };

  return (
    <div className={styles.estoqueContainer}>
      <div className={styles.estoqueBox}>
        
        {/* Topo com Título e Botão de Alternância */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ color: '#000', fontSize: '1.8rem', margin: 0 }}>
            {modoAvulso ? "📥 Entrada de Tela Avulsa" : "📝 Conferência e Entrada de Pedidos"}
          </h1>
          <button 
            type="button" 
            className={styles.btn}
            style={{ backgroundColor: modoAvulso ? '#000' : '#28a745', color: '#fff' }}
            onClick={() => setModoAvulso(!modoAvulso)}
          >
            {modoAvulso ? "← Voltar para Pedidos" : "+ Entrada Avulsa (Fora de Pedido)"}
          </button>
        </div>

        {modoAvulso ? (
          /* ==================== FORMULÁRIO DE ENTRADA AVULSA ==================== */
          <form onSubmit={handleSalvarAvulso} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #000' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#000' }}>Marca:</label>
              <select className={styles.inputSelect} value={marcaAvulsaId} onChange={e => setMarcaAvulsaId(e.target.value)} style={{ width: '100%' }}>
                {marcas.map(m => <option key={m.id} value={m.id}>{m.nome.toUpperCase()}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#000' }}>Modelo:</label>
              <input type="text" className={styles.inputTexto} placeholder="Ex: MOTO G54, IPHONE 11" value={modeloAvulso} onChange={e => setModeloAvulso(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="checkAroAvulso" checked={comAroAvulso} onChange={e => setComAroAvulso(e.target.checked)} />
              <label htmlFor="checkAroAvulso" style={{ fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>Com Aro?</label>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#000' }}>Quantidade que Chegou:</label>
              <input type="number" className={styles.inputNumero} placeholder="Ex: 5" value={qtdAvulsa} onChange={e => setQtdAvulsa(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#000' }}>Valor Atacado (R$):</label>
                <input type="number" step="0.01" className={styles.inputNumero} placeholder="0.00" value={valorAtacadoAvulso} onChange={e => setValorAtacadoAvulso(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#000' }}>Valor Varejo (R$):</label>
                <input type="number" step="0.01" className={styles.inputNumero} placeholder="0.00" value={valorVarejoAvulso} onChange={e => setValorVarejoAvulso(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <button type="submit" className={`${styles.btn} ${styles.btnSalvar}`} style={{ width: '100%', marginTop: '10px' }}>
              Injetar Direto no Estoque
            </button>
          </form>
        ) : (
          /* ==================== MODO CONFERÊNCIA DE PEDIDOS ==================== */
          <div>
            {/* Seletor de Pedidos Pendentes */}
            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              
              {itensConferidos.length > 0 && (
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label style={{ fontWeight: 'bold', color: '#000', fontSize: '1.1rem', display: 'block', marginBottom: '5px' }}>Busca:</label>
                  <input 
                    type="text"
                    className={styles.inputTexto}
                    placeholder="Buscar..."
                    value={pesquisaItem}
                    onChange={(e) => setPesquisaItem(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
              )}
              <div>
                
                <label style={{ fontWeight: 'bold', color: '#000', fontSize: '1.1rem', display: 'block', marginBottom: '5px' }}>Escolha o Pedido:</label>
                <select 
                  className={styles.inputSelect} 
                  value={pedidoSelecionadoId} 
                  onChange={(e) => carregarPedidoParaConferencia(e.target.value)}
                  style={{ width: '350px', padding: '10px' }}
                >
                  {pedidosPendentes.length === 0 && <option value="">Nenhum pedido pendente encontrado</option>}
                  {pedidosPendentes.map(p => (
                    <option key={p.id} value={p.id}>Pedido #{p.id} — Feito em {p.data_pedido}</option>
                  ))}
                </select>
              </div>

              {/* NOVO CAMPO: INPUT DE BUSCA DINÂMICA */}
              
            </div>

            {itensConferidos.length > 0 ? (
              <form onSubmit={handleConfirmarEntradaPedido}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th>MARCA</th>
                      <th>MODELO</th>
                      <th>ARO</th>
                      <th>QTD SOLICITADA</th>
                      <th style={{ width: '200px' }}>QTD QUE CHEGOU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ALTERADO: Agora mapeia os "itensFiltrados" ao invés da lista bruta */}
                    {itensFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td style={{ textTransform: 'uppercase' }}>{item.marca}</td>
                        <td style={{ textTransform: 'uppercase' }}>{item.modelo}</td>
                        <td style={{ textTransform: 'uppercase' }}>{item.com_aro ? 'COM ARO' : 'SEM ARO'}</td>
                        <td style={{ fontWeight: 'bold' }}>{item.quantidade_pedida} un</td>
                        <td>
                          <input 
                            type="number"
                            className={styles.inputNumero}
                            min="0"
                            style={{ width: '100px', textAlign: 'center', padding: '5px', border: '1px solid #000' }}
                            value={item.qtd_recebida}
                            onChange={(e) => handleMudarQtdRecebida(item.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}

                    {/* Caso o filtro não encontre nada */}
                    {itensFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'red', fontWeight: 'bold' }}>
                          Nenhuma resultado encontrado para a busca "{pesquisaItem}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="submit" className={`${styles.btn} ${styles.btnSalvar}`} style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
                    ✔ Confirmar e Atualizar Sistema
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#000', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px dashed #000' }}>
                Selecione um pedido acima para iniciar a conferência das peças recebidas.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default DarEntrada;