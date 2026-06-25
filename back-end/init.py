from main import app
from database import db
from models import Usuario, Marca, Tela
from decimal import Decimal            

with app.app_context():
    # 1. Cria as tabelas se elas não existirem
    db.create_all()
    
    # ==========================================
    # 2. SEED DE USUÁRIOS
    # ==========================================
    if not Usuario.query.filter_by(login='admin').first():
        admin = Usuario(login='admin', senha='Sugon2020d', admin=True)
        tecnico = Usuario(login='usuario', senha='Pombal10', admin=False)
        db.session.add(admin)
        db.session.add(tecnico)
        db.session.commit()
        print("Usuários iniciais criados com sucesso!")
    else:
        print("Os usuários já existem no banco.")

    # ==========================================
    # 3. SEED DE MARCAS
    # ==========================================
    # Criamos um dicionário para guardar as marcas criadas e usá-las depois nas telas
    marcas_criadas = {}
    
    marcas_iniciais = ['Samsung', 'Apple', 'LG', 'Motorola', 'Xiaomi']
    
    for nome_marca in marcas_iniciais:
        # Verifica se a marca já existe
        marca_existente = Marca.query.filter_by(nome=nome_marca).first()
        
        if not marca_existente:
            nova_marca = Marca(nome=nome_marca)
            db.session.add(nova_marca)
            # Guardamos o objeto na memória
            marcas_criadas[nome_marca] = nova_marca
            print(f"Marca {nome_marca} adicionada para inserção.")
        else:
            marcas_criadas[nome_marca] = marca_existente

    # Commitamos as marcas para o banco gerar os IDs delas antes de criarmos as telas
    db.session.commit()

    # ==========================================
    # 4. SEED DE TELAS (EXEMPLO)
    # ==========================================
    # Só vamos cadastrar telas de teste se a tabela estiver completamente vazia
    if not Tela.query.first():
        
        # Exemplo 1: Tela de Samsung usando o ID da marca que acabou de ser criada/recuperada
        tela1 = Tela(
            modelo="Galaxy S23 Ultra",
            quantidade=5,
            com_aro=True,
            valor_atacado=Decimal('750.00'),
            valor_varejo=Decimal('990.00'),
            marca_id=marcas_criadas['Samsung'].id  # Aqui é feita a ligação automática!
        )
        
        # Exemplo 2: Tela de iPhone (Apple) sem aro
        tela2 = Tela(
            modelo="iPhone 13 Pro",
            quantidade=3,
            com_aro=False,
            valor_atacado=Decimal('1200.00'),
            valor_varejo=Decimal('1600.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        # Exemplo 3: Outra tela da Samsung, mas sem aro
        tela3 = Tela(
            modelo="Galaxy A54",
            quantidade=10,
            com_aro=False,
            valor_atacado=Decimal('250.00'),
            valor_varejo=Decimal('380.00'),
            marca_id=marcas_criadas['Samsung'].id
        )
        
        db.session.add_all([tela1, tela2, tela3]) # add_all adiciona uma lista de uma vez
        db.session.commit()
        print("Telas iniciais de teste criadas com sucesso!")
    else:
        print("A tabela de telas já possui registros.")