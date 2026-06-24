
from database import db

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    login = db.Column(db.String(100), nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    admin = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Usuario {self.login}>'

# Se no futuro você quiser criar a tabela de Produtos, basta colocá-la aqui:
# class Produto(db.Model):
#     __tablename__ = 'produtos'
#     ...