
from flask import Flask, request, jsonify, session
from database import db
from models import Usuario  # Importante importar os modelos para o Flask saber que eles existem

app = Flask(__name__)
app.secret_key = 'Sugon2020d'  # Necessário para usar sessions


app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost:5432/estoque_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    return "Backend Organizado e Rodando!"

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