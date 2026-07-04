import React, { useState, useEffect } from 'react';
import styles from '../css/Estoque.module.css'; // Reutilizando seu padrão visual
import Swal from 'sweetalert2'; // NOVO: Modais bonitões integrados

function ModalDarSaida({ isOpen, onClose, aoSucesso }) {
  const [telasEstoque, setTelasEstoque] = useState([]);
  const [marcas, setMarcas] = useState([]); // Guardar as marcas do banco
  const [tipoSaida, setTipoSaida] = useState('existente'); 
  const [pesquisaTela, setPesquisaTela] = useState('');
  
  // Form para item do estoque
  const [telaSelecionadaId, setTelaSelecionadaId] = useState('');
  const [qtdSaida, setQtdSaida] = useState('');

  // Form para item novo
  const [marcaSelecionadaId, setMarcaSelecionadaId] = useState(''); // Guarda o ID da marca escolhida
  const [novoModelo, setNovoModelo] = useState('');
  const [novoComAro, setNovoComAro] = useState(false);

  // 1. Carrega as telas e as marcas do banco assim que o modal abre
  useEffect(() => {
    if (isOpen) {
      // Puxa as telas
      fetch('/api/telas')
        .then(res => res.json())
        .then(dados => {
          setTelasEstoque(dados);
          if (dados.length > 0) setTelaSelecionadaId(dados[0].id);
        })
        .catch(err => console.error("Erro ao buscar estoque para o modal:", err));

      // Puxa as marcas do banco de dados
      fetch('/api/marcas')
        .then(res => res.json())
        .then(dados => {
          setMarcas(dados);
          if (dados.length > 0) setMarcaSelecionadaId(dados[0].id); // Seleciona a primeira por padrão
        })
        .catch(err => console.error("Erro ao buscar marcas para o modal:", err));
    }
  }, [isOpen]);

  // 2. Lógica de filtragem em tempo real por Marca ou Modelo
  const telasFiltradas = telasEstoque.filter(t => {
    const termo = pesquisaTela.toLowerCase();
    return (
      t.marca.toLowerCase().includes(termo) ||
      t.modelo.toLowerCase().includes(termo)
    );
  });

  // 3. Garante que se o filtro mudar a lista e a opção sumir, o estado atualiza
  useEffect(() => {
    if (telasFiltradas.length > 0) {
      const aindaExiste = telasFiltradas.some(t => t.id === parseInt(telaSelecionadaId));
      if (!aindaExiste) {
        setTelaSelecionadaId(telasFiltradas[0].id);
      }
    } else {
      setTelaSelecionadaId('');
    }
  }, [pesquisaTela, telasEstoque]);

  const handleFecharModal = () => {
    setPesquisaTela('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const quantidade = parseInt(qtdSaida);

    if (!quantidade || quantidade <= 0) {
      Swal.fire({
        title: 'Quantidade Inválida',
        text: 'Por favor, insira uma quantidade válida maior que zero.',
        icon: 'warning',
        confirmButtonColor: '#e0a307',
        didOpen: () => { Swal.getContainer().style.zIndex = "3000"; } // <--- AQUI
      });
      return;
    }

    let dadosPayload = { quantidade };

    if (tipoSaida === 'existente') {
      if (!telaSelecionadaId) {
        Swal.fire({
          title: 'Atenção',
          text: 'Nenhuma tela selecionada ou correspondente ao filtro aplicado.',
          icon: 'warning',
          confirmButtonColor: '#000',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        return;
      }

      const telaReal = telasEstoque.find(t => t.id === parseInt(telaSelecionadaId));
      
      if (!telaReal) {
        Swal.fire({
          title: 'Erro',
          text: 'Tela não encontrada no estoque local.',
          icon: 'error',
          confirmButtonColor: '#000',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        return;
      }

      // MODAL DE CONFIRMAÇÃO: Alerta de estoque negativo customizado
      if (telaReal.quantidade < quantidade || telaReal.quantidade === 0) {
        const resultadoConfirmacao = await Swal.fire({
          title: '⚠️ Estoque Insuficiente',
          html: `Você está dando saída de <b>${quantidade} un</b>, mas possui apenas <b>${telaReal.quantidade} un</b> em estoque.<br><br>O saldo deste item ficará negativo. Deseja continuar mesmo assim?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#000',
          confirmButtonText: 'Sim, continuar',
          cancelButtonText: 'Cancelar',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        
        if (!resultadoConfirmacao.isConfirmed) return; 
      }

      dadosPayload.tela_id = telaReal.id;
    } else {
      const marcaReal = marcas.find(m => m.id === parseInt(marcaSelecionadaId));
      
      if (!marcaReal || !novoModelo.trim()) {
        Swal.fire({
          title: 'Campos Obrigatórios',
          text: 'Marca e Modelo são obrigatórios para registrar a saída de novos itens.',
          icon: 'warning',
          confirmButtonColor: '#e0a307',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        return;
      }
      
      dadosPayload.marca = marcaReal.nome; 
      dadosPayload.modelo = novoModelo;
      dadosPayload.com_aro = novoComAro;
    }

    try {
      const resposta = await fetch('/api/saidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPayload)
      });

      if (resposta.ok) {
        Swal.fire({
          title: 'Saída Registrada!',
          text: 'A movimentação foi salva no sistema com sucesso.',
          icon: 'success',
          confirmButtonColor: '#28a745',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
        
        setQtdSaida('');
        setNovoModelo('');
        setNovoComAro(false);
        setPesquisaTela(''); 
        aoSucesso(); 
        onClose();
      } else {
        const erro = await resposta.json();
        Swal.fire({
          title: 'Erro no Servidor',
          text: erro.erro || "Não foi possível registrar a saída.",
          icon: 'error',
          confirmButtonColor: '#000',
          didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
        });
      }
    } catch (err) {
      console.error("Erro na requisição de saída:", err);
      Swal.fire({
        title: 'Erro Crítico',
        text: 'Falha de comunicação com o servidor.',
        icon: 'error',
        confirmButtonColor: '#000',
        didOpen: () => { Swal.getContainer().style.zIndex = "3000"; }
      });
    }
  };

  return isOpen ? (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 2000
    }}>
      <div className={styles.estoqueBox} style={{ width: '500px', maxWidth: '90%' }}>
        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>Registrar Saída de Tela</h2>
        
        {/* Abas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            type="button"
            className={styles.btn} 
            style={{ backgroundColor: tipoSaida === 'existente' ? '#e0a307' : '#ccc', color: '#000' }}
            onClick={() => setTipoSaida('existente')}
          >
            Item do Estoque
          </button>
          <button 
            type="button"
            className={styles.btn} 
            style={{ backgroundColor: tipoSaida === 'novo' ? '#e0a307' : '#ccc', color: '#000' }}
            onClick={() => setTipoSaida('novo')}
          >
            + Item Novo
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tipoSaida === 'existente' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Selecione a Tela:</label>
                <input 
                  type="text"
                  className={styles.inputTexto}
                  placeholder="Digite a marca ou o modelo para buscar..."
                  value={pesquisaTela}
                  onChange={(e) => setPesquisaTela(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
                <select 
                  className={styles.inputSelect} 
                  value={telaSelecionadaId} 
                  onChange={(e) => setTelaSelecionadaId(e.target.value)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  {telasFiltradas.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.marca.toUpperCase()} - {t.modelo.toUpperCase()} ({t.com_aro ? 'COM ARO' : 'SEM ARO'}) [Disp: {t.quantidade}]
                    </option>
                  ))}
                  
                  {telasFiltradas.length === 0 && (
                    <option value="">Nenhuma peça corresponde ao filtro</option>
                  )}
                </select>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Marca:</label>
                <select 
                  className={styles.inputSelect} 
                  value={marcaSelecionadaId} 
                  onChange={(e) => setMarcaSelecionadaId(e.target.value)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  {marcas.map(m => (
                    <option key={m.id} value={m.id}>{m.nome.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Modelo:</label>
                <input 
                  type="text" 
                  className={styles.inputTexto} 
                  placeholder="modelo" 
                  value={novoModelo} 
                  onChange={e => setNovoModelo(e.target.value)} 
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input className={styles.inputCheckbox}
                  type="checkbox" 
                  id="modalAro" 
                  checked={novoComAro} 
                  onChange={e => setNovoComAro(e.target.checked)} 
                />
                <label htmlFor="modalAro" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Com Aro?</label>
              </div>
            </div>
          )}

          <div style={{ marginTop: '15px', marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Quantidade de Saída:</label>
            <input 
              type="number" 
              className={styles.inputNumero} 
              placeholder="Qtd" 
              value={qtdSaida} 
              onChange={e => setQtdSaida(e.target.value)} 
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className={`${styles.btn} ${styles.btnCancelar}`} onClick={handleFecharModal}>Fechar</button>
            <button type="submit" className={`${styles.btn} ${styles.btnSalvar}`}>Confirmar Saída</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}

export default ModalDarSaida;