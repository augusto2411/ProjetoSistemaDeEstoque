from decimal import Decimal
from functools import wraps            
from flask import Flask, request, jsonify, session
from database import db
from models import Usuario, Marca, Tela, SaidaTela, Pedido, ItemPedido
from sqlalchemy import func

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. Verifica se o usuário está logado
        if 'usuario_id' not in session:
            return jsonify({'erro': 'Login necessário.'}), 401
        
        # 2. Verifica se o usuário é administrador
        if not session.get('is_admin'):
            return jsonify({'erro': 'Acesso negado. Apenas administradores.'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

app = Flask(__name__)
app.secret_key = 'Sugon2020d'  # Necessário para usar sessions


app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost:5432/estoque_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
# ==========================================
# 1. ROTA DE LISTAGEM (GET)
# ==========================================
@app.route('/api/telas', methods=['GET'])
def listar_telas():
    # Buscamos todas as telas do banco
    telas = Tela.query.all()
    
    lista_telas = []
    for tela in telas:
        # Aqui está o "pulo do gato": acessamos o nome da marca 
        # diretamente graças ao relacionamento (backref='marca') do SQLAlchemy
        lista_telas.append({
            'id': tela.id,
            'modelo': tela.modelo,
            'quantidade': tela.quantidade,
            'com_aro': tela.com_aro,
            'valor_atacado': float(tela.valor_atacado), # Convertendo Decimal para float para o JSON
            'valor_varejo': float(tela.valor_varejo),
            'marca': tela.marca.nome if tela.marca else "Sem Marca"
        })
        
    return jsonify(lista_telas), 200


# ==========================================
# 2. ROTA DE CRIAÇÃO (POST)
# ==========================================
@app.route('/api/telas', methods=['POST'])
@admin_required
def criar_tela():
    dados = request.get_json()
    
    try:
        nova_tela = Tela(
            modelo=dados['modelo'],
            quantidade=int(dados['quantidade']),
            com_aro=bool(dados['com_aro']), # Garante que vira True ou False
            valor_atacado=Decimal(str(dados['valor_atacado'])),
            valor_varejo=Decimal(str(dados['valor_varejo'])),
            marca_id=int(dados['marca_id']) # Recebe o ID da marca selecionada no <select>
        )
        
        db.session.add(nova_tela)
        db.session.commit()
        
        return jsonify({"mensagem": "Tela cadastrada com sucesso!", "id": nova_tela.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao cadastrar: {str(e)}"}), 400

@app.route('/api/pedidos/dar-entrada/<int:pedido_id>', methods=['POST'])
@admin_required
def dar_entrada_pedido(pedido_id):
    try:
        dados = request.json  # Espera { itens: [...], confirmar_precos: true/false }
        pedido = db.session.get(Pedido, pedido_id) # Atualizado para o padrão moderno
        
        if not pedido:
            return jsonify({'erro': 'Pedido não encontrado.'}), 404
            
        if pedido.status == 'CONCLUIDO':
            return jsonify({'erro': 'Este pedido já recebeu entrada anteriormente.'}), 400

        # --- FASE 1: CHECAGEM DE PREÇOS EM FALTA ---
        if not dados.get('confirmar_precos', False):
            itens_sem_preco = []
            
            for item_conferido in dados.get('itens', []):
                item_pedido = db.session.get(ItemPedido, item_conferido['id'])
                if not item_pedido or int(item_conferido['qtd_recebida']) <= 0:
                    continue
                
                # CORREÇÃO DA BUSCA: Ignora espaços extras e maiúsculas/minúsculas
                modelo_termo = item_pedido.modelo.strip().lower() if item_pedido.modelo else ""
                tela_estoque = Tela.query.filter(
                    func.trim(func.lower(Tela.modelo)) == modelo_termo,
                    Tela.com_aro == item_pedido.com_aro
                ).first()
                
                # Se a tela realmente não existe OU se existe mas está com preço zerado
                if not tela_estoque or (tela_estoque.valor_atacado == 0 or tela_estoque.valor_atacado is None):
                    itens_sem_preco.append({
                        'id': item_conferido['id'],
                        'modelo': item_pedido.modelo,
                        'marca': item_pedido.marca
                    })
            
            if itens_sem_preco:
                return jsonify({
                    'requer_precos': True,
                    'itens_pendentes': itens_sem_preco
                }), 200

        # --- FASE 2: PROCESSAMENTO DA ENTRADA REAIS ---
        precos_enviados = {
            int(i['id']): {
                'atacado': float(i.get('preco_custo', 0)),
                'varejo': float(i.get('preco_venda', 0))
            } for i in dados.get('itens', []) if 'preco_custo' in i
        }

        for item_conferido in dados.get('itens', []):
            item_pedido = db.session.get(ItemPedido, item_conferido['id'])
            if not item_pedido:
                continue

            qtd_recebida = int(item_conferido['qtd_recebida'])
            item_pedido.qtd_recebida = qtd_recebida

            if qtd_recebida > 0:
                # CORREÇÃO DA BUSCA TAMBÉM NO MOMENTO DE SALVAR
                modelo_termo = item_pedido.modelo.strip().lower() if item_pedido.modelo else ""
                tela_estoque = Tela.query.filter(
                    func.trim(func.lower(Tela.modelo)) == modelo_termo,
                    Tela.com_aro == item_pedido.com_aro
                ).first()
                
                id_item = int(item_conferido['id'])
                preco_atacado_novo = precos_enviados.get(id_item, {}).get('atacado', 0.0)
                preco_varejo_novo = precos_enviados.get(id_item, {}).get('varejo', 0.0)

                if tela_estoque:
                    tela_estoque.quantidade += qtd_recebida
                    if (tela_estoque.valor_atacado == 0 or tela_estoque.valor_atacado is None) and preco_atacado_novo > 0:
                        tela_estoque.valor_atacado = preco_atacado_novo
                        tela_estoque.valor_varejo = preco_varejo_novo
                else:
                    from models import Marca
                    marca_obj = Marca.query.filter(func.trim(func.lower(Marca.nome)) == item_pedido.marca.strip().lower()).first()
                    nova_tela = Tela(
                        marca_id=marca_obj.id if marca_obj else 1,
                        modelo=item_pedido.modelo.strip().upper(),
                        quantidade=qtd_recebida,
                        com_aro=item_pedido.com_aro,
                        valor_atacado=preco_atacado_novo,
                        valor_varejo=preco_varejo_novo
                    )
                    db.session.add(nova_tela)

            # 2. Se veio A MENOS, joga a diferença de volta para as Saídas
            qtd_em_falta = item_pedido.quantidade - qtd_recebida
            if qtd_em_falta > 0:
                nova_saida_falta = SaidaTela(
                    marca=item_pedido.marca.strip().upper(),
                    modelo=item_pedido.modelo.strip().upper(),
                    com_aro=item_pedido.com_aro,
                    quantidade=qtd_em_falta
                )
                db.session.add(nova_saida_falta)

        pedido.status = 'CONCLUIDO'
        db.session.commit()
        
        return jsonify({'mensagem': 'Entrada processada com sucesso! Estoque e preços atualizados.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao processar entrada do pedido: {str(e)}'}), 500

# ==========================================
# 3. ROTA DE EDIÇÃO (PUT)
# ==========================================
@app.route('/api/telas/<int:id>', methods=['PUT'])
@admin_required
def editar_tela(id):
    # Busca a tela específica pelo ID ou retorna 404 se não achar
    tela = Tela.query.get_or_404(id)
    dados = request.get_json()
    marca_id_atual = dados.get('marca_id')

    try:
        # Atualiza os campos com os novos dados vindos da linha editada
        tela.modelo = dados.get('modelo', tela.modelo)
        tela.quantidade = int(dados.get('quantidade', tela.quantidade))
        tela.com_aro = bool(dados.get('com_aro', tela.com_aro))
        tela.valor_atacado = Decimal(str(dados.get('valor_atacado', tela.valor_atacado)))
        tela.valor_varejo = Decimal(str(dados.get('valor_varejo', tela.valor_varejo)))
        tela.marca_id = int(marca_id_atual) if marca_id_atual is not None else tela.marca_id
        
        db.session.commit()
        return jsonify({"mensagem": f"Tela {id} atualizada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao atualizar: {str(e)}"}), 400


# ==========================================
# 4. ROTA DE EXCLUSÃO (DELETE)
# ==========================================
@app.route('/api/telas/<int:id>', methods=['DELETE'])
@admin_required
def excluir_tela(id):
    tela = Tela.query.get_or_404(id)
    
    try:
        db.session.delete(tela)
        db.session.commit()
        return jsonify({"mensagem": f"Tela {id} excluída com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao excluir: {str(e)}"}), 400

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    login_digitado = dados.get('login')
    senha_digitada = dados.get('senha')
    
    # Busca o usuário no banco
    usuario = Usuario.query.filter_by(login=login_digitado).first()
    
    # Verifica se o usuário existe e a senha bate (lembre-se de usar hash em produção!)
    if usuario and usuario.senha == senha_digitada:
        # 🔑 Aqui está o segredo: salvamos os dados dele na sessão do Flask
        session['usuario_id'] = usuario.id
        session['is_admin'] = usuario.admin # Salva se ele é admin (True ou False)
        
        return jsonify({
            "mensagem": "Login realizado com sucesso!",
            "admin": usuario.admin # Retorna para o Frontend saber quem logou
        }), 200
        
    return jsonify({"erro": "Login ou senha incorretos"}), 401

@app.route('/api/marcas', methods=['GET'])
def listar_marcas():
    marcas = Marca.query.all()
    lista_marcas = [{'id': m.id, 'nome': m.nome} for m in marcas]
    return jsonify(lista_marcas), 200

@app.route('/logout', methods=['POST'])
def logout():
    session.clear() # Apaga tudo que estava salvo na sessão
    return jsonify({"mensagem": "Logout realizado com sucesso!"}), 200

@app.route('/api/saidas', methods=['POST'])

def registrar_saida():
    try:
        dados = request.json
        quantidade = int(dados.get('quantidade', 0))
        
        # Pega as informações dependendo se veio do estoque (tela_id) ou se é item novo
        if 'tela_id' in dados:
            from models import Tela
            tela_real = Tela.query.get(dados['tela_id'])
            if not tela_real:
                return jsonify({'erro': 'Tela não encontrada no estoque.'}), 404
            
            marca = tela_real.marca.nome if hasattr(tela_real.marca, 'nome') else tela_real.marca
            modelo = tela_real.modelo
            com_aro = tela_real.com_aro

            # --- NOVO: Subtrai a quantidade do estoque real ---
            # (Mesmo que fique negativo, pois o seu front já avisa e o usuário confirmou)
            tela_real.quantidade -= quantidade
        else:
            marca = dados.get('marca')
            modelo = dados.get('modelo')
            com_aro = bool(dados.get('com_aro', False))

        if not marca or not modelo or quantidade <= 0:
            return jsonify({'erro': 'Dados inválidos para registrar saída.'}), 400

        # Procura se já existe exatamente essa mesma tela na lista de saídas atual
        saida_existente = SaidaTela.query.filter_by(
            marca=marca.upper(),
            modelo=modelo.upper(),
            com_aro=com_aro
        ).first()

        if saida_existente:
            # Se já existir na lista de pedidos/saídas, soma a quantidade na mesma linha
            saida_existente.quantidade += quantidade
        else:
            # Se não existir, cria um registro novo na tabela de saídas
            nova_saida = SaidaTela(
                marca=marca.upper(),
                modelo=modelo.upper(),
                com_aro=com_aro,
                quantidade=quantidade
            )
            db.session.add(nova_saida)

        db.session.commit()
        return jsonify({'mensagem': 'Saída registrada e estoque atualizado com sucesso!'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao registrar saída: {str(e)}'}), 500
@app.route('/api/saidas', methods=['GET'])
def listar_saidas():
    # Qualquer um pode ver a lista agora, sem @admin_required
    saidas = SaidaTela.query.order_by(SaidaTela.data_saida.desc()).all()
    
    resultado = []
    for s in saidas:
        resultado.append({
            'id': s.id,
            'marca': s.marca,
            'modelo': s.modelo,
            'com_aro': s.com_aro,
            'quantidade': s.quantidade,
            'data_saida': s.data_saida.strftime('%d/%m/%Y %H:%M')
        })
        
    return jsonify(resultado), 200

# 1. ROTA PARA EXCLUIR UMA SAÍDA (PROTEGIDA PARA ADMIN)
@app.route('/api/saidas/<int:id>', methods=['DELETE'])
@admin_required
def excluir_saida(id):
    # Atualizado para o método moderno do SQLAlchemy 2.0
    saida = db.session.get(SaidaTela, id)
    if not saida:
        return jsonify({'erro': 'Registro de saída não encontrado.'}), 404

    try:
        tela = None
        if saida.tela_id:
            tela = db.session.get(Tela, saida.tela_id)
        
        # BUSCA ULTRA RESISTENTE: ignora espaços e diferença de maiúsculas/minúsculas
        if not tela and saida.modelo:
            modelo_termo = saida.modelo.strip().lower()
            tela = Tela.query.filter(
                func.trim(func.lower(Tela.modelo)) == modelo_termo,
                Tela.com_aro == saida.com_aro
            ).first()

        if tela:
            tela.quantidade += saida.quantidade
            print(f"-> ESTOQUE RESTAURADO: Devolvido {saida.quantidade} un para {tela.modelo}. Novo estoque: {tela.quantidade}")
        else:
            print(f"⚠️ AVISO: Tela '{saida.modelo}' (Aro: {saida.com_aro}) não encontrada no estoque para devolver as peças da exclusão.")

        db.session.delete(saida)
        db.session.commit()
        
        return jsonify({'mensagem': 'Saída excluída e estoque restaurado com sucesso!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao excluir: {str(e)}'}), 500

# 2. ROTA PARA EDITAR UMA SAÍDA (PROTEGIDA PARA ADMIN)
@app.route('/api/saidas/<int:id>', methods=['PUT'])
@admin_required
def editar_saida(id):
    # Atualizado para o método moderno do SQLAlchemy 2.0
    saida = db.session.get(SaidaTela, id)
    if not saida:
        return jsonify({'erro': 'Registro de saída não encontrado.'}), 404

    dados = request.get_json()
    nova_quantidade = dados.get('quantidade')

    if not nova_quantidade or nova_quantidade <= 0:
        return jsonify({'erro': 'Quantidade inválida.'}), 400

    try:
        diferenca = saida.quantidade - nova_quantidade

        tela = None
        if saida.tela_id:
            tela = db.session.get(Tela, saida.tela_id)
        
        # BUSCA ULTRA RESISTENTE: ignora espaços e diferença de maiúsculas/minúsculas
        if not tela and saida.modelo:
            modelo_termo = saida.modelo.strip().lower()
            tela = Tela.query.filter(
                func.trim(func.lower(Tela.modelo)) == modelo_termo,
                Tela.com_aro == saida.com_aro
            ).first()

        if tela:
            tela.quantidade += diferenca
            print(f"-> ESTOQUE ATUALIZADO: Tela {tela.modelo} alterada em {diferenca} un. Novo estoque: {tela.quantidade}")
        else:
            print(f"⚠️ AVISO: Tela '{saida.modelo}' (Aro: {saida.com_aro}) não foi encontrada no estoque para atualizar.")

        saida.quantidade = nova_quantidade
        saida.marca = dados.get('marca', saida.marca).strip().upper()
        saida.modelo = dados.get('modelo', saida.modelo).strip().upper()
        saida.com_aro = dados.get('com_aro', saida.com_aro)

        db.session.commit()
        return jsonify({'mensagem': 'Saída atualizada com sucesso e estoque recalculado!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao atualizar: {str(e)}'}), 500
    
@app.route('/api/pedidos/fechar', methods=['POST'])
@admin_required
def fechar_pedido():
    try:
        # 1. Pega todas as saídas atuais (o rascunho)
        saidas_atuis = SaidaTela.query.all()
        
        if not saidas_atuis:
            return jsonify({'erro': 'Não há nenhuma tela na lista de saídas para gerar um pedido.'}), 400
            
        # 2. Cria o cabeçalho do novo Pedido
        novo_pedido = Pedido()
        db.session.add(novo_pedido)
        db.session.flush() # Gera o ID do pedido antes do commit definitivo
        
        # 3. Transfere cada item do rascunho para o histórico de pedidos
        for s in saidas_atuis:
            item_historico = ItemPedido(
                pedido_id=novo_pedido.id,
                marca=s.marca,
                modelo=s.modelo,
                com_aro=s.com_aro,
                quantidade=s.quantidade
            )
            db.session.add(item_historico)
            
            # 4. Remove o item da tabela temporária de saídas
            db.session.delete(s)
            
        db.session.commit()
        return jsonify({'mensagem': 'Pedido fechado com sucesso e lista de saídas resetada!', 'pedido_id': novo_pedido.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao fechar pedido: {str(e)}'}), 500

@app.route('/api/pedidos', methods=['GET'])
@admin_required
def listar_pedidos():
    pedidos = Pedido.query.order_by(Pedido.data_pedido.desc()).all()
    resultado = []
    for p in pedidos:
        itens_json = []
        for item in p.itens:
            itens_json.append({
                'id': item.id, # Enviamos o ID do item para a conferência no front
                'marca': item.marca,
                'modelo': item.modelo,
                'com_aro': item.com_aro,
                'quantidade': item.quantidade,
                'qtd_recebida': item.qtd_recebida
            })
        resultado.append({
            'id': p.id,
            'data_pedido': p.data_pedido.strftime('%d/%m/%Y %H:%M'),
            'status': p.status, # <-- IMPORTANTE: Envia o status para o React saber filtrar
            'itens': itens_json
        })
    return jsonify(resultado), 200

if __name__ == '__main__':
    app.run(debug=True)