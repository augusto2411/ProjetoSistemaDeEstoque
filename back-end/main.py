from decimal import Decimal            
from flask import Flask, request, jsonify, session
from database import db
from models import Usuario, Marca, Tela

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


# ==========================================
# 3. ROTA DE EDIÇÃO (PUT)
# ==========================================
@app.route('/api/telas/<int:id>', methods=['PUT'])
def editar_tela(id):
    # Busca a tela específica pelo ID ou retorna 404 se não achar
    tela = Tela.query.get_or_404(id)
    dados = request.get_json()
    
    try:
        # Atualiza os campos com os novos dados vindos da linha editada
        tela.modelo = dados.get('modelo', tela.modelo)
        tela.quantidade = int(dados.get('quantidade', tela.quantidade))
        tela.com_aro = bool(dados.get('com_aro', tela.com_aro))
        tela.valor_atacado = Decimal(str(dados.get('valor_atacado', tela.valor_atacado)))
        tela.valor_varejo = Decimal(str(dados.get('valor_varejo', tela.valor_varejo)))
        tela.marca_id = int(dados.get('marca_id', tela.marca_id))
        
        db.session.commit()
        return jsonify({"mensagem": f"Tela {id} atualizada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao atualizar: {str(e)}"}), 400


# ==========================================
# 4. ROTA DE EXCLUSÃO (DELETE)
# ==========================================
@app.route('/api/telas/<int:id>', methods=['DELETE'])
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

@app.route('/logout', methods=['POST'])
def logout():
    session.clear() # Apaga tudo que estava salvo na sessão
    return jsonify({"mensagem": "Logout realizado com sucesso!"}), 200

if __name__ == '__main__':
    app.run(debug=True)