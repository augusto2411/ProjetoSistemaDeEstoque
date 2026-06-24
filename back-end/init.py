from main import app
from database import db
from models import Usuario

with app.app_context():
    # 1. Cria as tabelas se elas não existirem
    db.create_all()
    
    # 2. Verifica se já existem usuários para não duplicar
    if not Usuario.query.filter_by(login='admin').first():
        # Cria o Admin
        admin = Usuario(login='admin', senha='Sugon2020d', admin=True)
        # Cria o Técnico/Normal
        tecnico = Usuario(login='usuario', senha='Pombal10', admin=False)
        
        # Adiciona e salva no banco
        db.session.add(admin)
        db.session.add(tecnico)
        db.session.commit()
        print("Usuários iniciais criados com sucesso!")
    else:
        print("Os usuários já existem no banco.")