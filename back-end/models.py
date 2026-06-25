
from database import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    login = db.Column(db.String(100), nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    admin = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Usuario {self.login}>'

class Marca(db.Model):
    __tablename__ = 'marcas'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False, unique=True)
    
    # Isso permite acessar todas as telas de uma marca facilmente (ex: marca.telas)
    telas = db.relationship('Tela', backref='marca', lazy=True)

    def __repr__(self):
        return f"<Marca {self.nome}>"

class Tela(db.Model):
    __tablename__ = 'telas'
    
    id = db.Column(db.Integer, primary_key=True)
    modelo = db.Column(db.String(100), nullable=False)
    quantidade = db.Column(db.Integer, default=0, nullable=False)
    com_aro = db.Column(db.Boolean, default=False, nullable=False) # True para com aro, False para sem aro
    valor_atacado = db.Column(db.Numeric(10, 2), nullable=False)   # Numeric é ideal para dinheiro
    valor_varejo = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Chave estrangeira ligando a tela à tabela de marcas
    marca_id = db.Column(db.Integer, db.ForeignKey('marcas.id'), nullable=False)

    def __repr__(self):
        return f"<Tela {self.modelo} - {'Com Aro' if self.com_aro else 'Sem Aro'}>"

# Se no futuro você quiser criar a tabela de Produtos, basta colocá-la aqui:
# class Produto(db.Model):
#     __tablename__ = 'produtos'
#     ...