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
        # Samsung
        tela1 = Tela(
            modelo="Galaxy S23 Ultra",
            quantidade=5,
            com_aro=True,
            valor_atacado=Decimal('750.00'),
            valor_varejo=Decimal('990.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        tela2 = Tela(
            modelo="Galaxy S24 Ultra",
            quantidade=4,
            com_aro=True,
            valor_atacado=Decimal('890.00'),
            valor_varejo=Decimal('1150.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        tela3 = Tela(
            modelo="Galaxy S23",
            quantidade=8,
            com_aro=False,
            valor_atacado=Decimal('480.00'),
            valor_varejo=Decimal('680.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        tela4 = Tela(
            modelo="Galaxy A54",
            quantidade=10,
            com_aro=False,
            valor_atacado=Decimal('250.00'),
            valor_varejo=Decimal('380.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        tela5 = Tela(
            modelo="Galaxy A34",
            quantidade=12,
            com_aro=False,
            valor_atacado=Decimal('220.00'),
            valor_varejo=Decimal('340.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        tela6 = Tela(
            modelo="Galaxy A15",
            quantidade=20,
            com_aro=False,
            valor_atacado=Decimal('140.00'),
            valor_varejo=Decimal('240.00'),
            marca_id=marcas_criadas['Samsung'].id
        )

        # Apple
        tela7 = Tela(
            modelo="iPhone 13 Pro",
            quantidade=3,
            com_aro=False,
            valor_atacado=Decimal('1200.00'),
            valor_varejo=Decimal('1600.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        tela8 = Tela(
            modelo="iPhone 13",
            quantidade=5,
            com_aro=False,
            valor_atacado=Decimal('820.00'),
            valor_varejo=Decimal('1150.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        tela9 = Tela(
            modelo="iPhone 14",
            quantidade=4,
            com_aro=False,
            valor_atacado=Decimal('980.00'),
            valor_varejo=Decimal('1350.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        tela10 = Tela(
            modelo="iPhone 14 Pro Max",
            quantidade=2,
            com_aro=False,
            valor_atacado=Decimal('1550.00'),
            valor_varejo=Decimal('2100.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        tela11 = Tela(
            modelo="iPhone 11",
            quantidade=8,
            com_aro=False,
            valor_atacado=Decimal('450.00'),
            valor_varejo=Decimal('680.00'),
            marca_id=marcas_criadas['Apple'].id
        )

        # Motorola
        tela12 = Tela(
            modelo="Moto G84",
            quantidade=9,
            com_aro=False,
            valor_atacado=Decimal('190.00'),
            valor_varejo=Decimal('320.00'),
            marca_id=marcas_criadas['Motorola'].id
        )

        tela13 = Tela(
            modelo="Moto G54",
            quantidade=10,
            com_aro=False,
            valor_atacado=Decimal('170.00'),
            valor_varejo=Decimal('290.00'),
            marca_id=marcas_criadas['Motorola'].id
        )

        tela14 = Tela(
            modelo="Edge 40",
            quantidade=5,
            com_aro=True,
            valor_atacado=Decimal('420.00'),
            valor_varejo=Decimal('620.00'),
            marca_id=marcas_criadas['Motorola'].id
        )

        tela15 = Tela(
            modelo="Moto G73",
            quantidade=6,
            com_aro=False,
            valor_atacado=Decimal('180.00'),
            valor_varejo=Decimal('300.00'),
            marca_id=marcas_criadas['Motorola'].id
        )

        # Xiaomi
        tela16 = Tela(
            modelo="Redmi Note 13",
            quantidade=15,
            com_aro=False,
            valor_atacado=Decimal('170.00'),
            valor_varejo=Decimal('290.00'),
            marca_id=marcas_criadas['Xiaomi'].id
        )

        tela17 = Tela(
            modelo="Redmi Note 13 Pro",
            quantidade=8,
            com_aro=False,
            valor_atacado=Decimal('280.00'),
            valor_varejo=Decimal('430.00'),
            marca_id=marcas_criadas['Xiaomi'].id
        )

        tela18 = Tela(
            modelo="Poco X6",
            quantidade=7,
            com_aro=False,
            valor_atacado=Decimal('260.00'),
            valor_varejo=Decimal('410.00'),
            marca_id=marcas_criadas['Xiaomi'].id
        )

        tela19 = Tela(
            modelo="Redmi 13C",
            quantidade=18,
            com_aro=False,
            valor_atacado=Decimal('120.00'),
            valor_varejo=Decimal('220.00'),
            marca_id=marcas_criadas['Xiaomi'].id
        )

        # LG
        tela22 = Tela(
            modelo="LG K62",
            quantidade=4,
            com_aro=False,
            valor_atacado=Decimal('110.00'),
            valor_varejo=Decimal('200.00'),
            marca_id=marcas_criadas['LG'].id
        )

        tela23 = Tela(
            modelo="LG K52",
            quantidade=5,
            com_aro=False,
            valor_atacado=Decimal('100.00'),
            valor_varejo=Decimal('180.00'),
            marca_id=marcas_criadas['LG'].id
        )

        tela24 = Tela(
            modelo="LG Velvet",
            quantidade=2,
            com_aro=True,
            valor_atacado=Decimal('320.00'),
            valor_varejo=Decimal('520.00'),
            marca_id=marcas_criadas['LG'].id
        )

        # Adicionar todas ao banco
        db.session.add_all([
            tela1, tela2, tela3, tela4, tela5, tela6,
            tela7, tela8, tela9, tela10, tela11,
            tela12, tela13, tela14, tela15,
            tela16, tela17, tela18, tela19,
            tela22, tela23, tela24
        ])

        db.session.commit()
        print("Telas iniciais de teste criadas com sucesso!")
    else:
        print("A tabela de telas já possui registros.")