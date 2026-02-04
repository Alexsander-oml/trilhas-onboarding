from users.models import Setor, SubSetor

print("Criando setores provisórios...")

# Criar setores
setores_data = [
    {"nome": "Tecnologia da Informação", "descricao": "Setor de TI e Desenvolvimento"},
    {"nome": "Recursos Humanos", "descricao": "Setor de RH e Gestão de Pessoas"},
    {"nome": "Financeiro", "descricao": "Setor Financeiro e Contabilidade"},
    {"nome": "Operações", "descricao": "Setor de Operações"},
]

setores_criados = []
for data in setores_data:
    setor, created = Setor.objects.get_or_create(
        nome=data["nome"],
        defaults={"descricao": data["descricao"]}
    )
    setores_criados.append(setor)
    status = "✓ Criado" if created else "✓ Já existia"
    print(f"{status}: {setor.nome}")

# Criar sub-setores
subsetores_data = [
    {"setor": "Tecnologia da Informação", "nome": "Desenvolvimento", "descricao": "Desenvolvimento de Software"},
    {"setor": "Tecnologia da Informação", "nome": "Infraestrutura", "descricao": "Infraestrutura e Redes"},
    {"setor": "Recursos Humanos", "nome": "Recrutamento", "descricao": "Recrutamento e Seleção"},
    {"setor": "Recursos Humanos", "nome": "Treinamento", "descricao": "Treinamento e Desenvolvimento"},
    {"setor": "Financeiro", "nome": "Contabilidade", "descricao": "Contabilidade"},
    {"setor": "Financeiro", "nome": "Tesouraria", "descricao": "Tesouraria e Fluxo de Caixa"},
    {"setor": "Operações", "nome": "Logística", "descricao": "Logística"},
    {"setor": "Operações", "nome": "Produção", "descricao": "Produção"},
]

print("\nCriando sub-setores...")
for data in subsetores_data:
    setor = Setor.objects.get(nome=data["setor"])
    subsetor, created = SubSetor.objects.get_or_create(
        setor=setor,
        nome=data["nome"],
        defaults={"descricao": data["descricao"]}
    )
    status = "✓ Criado" if created else "✓ Já existia"
    print(f"{status}: {setor.nome} > {subsetor.nome}")

print("\n" + "="*50)
print(f"Total de setores: {Setor.objects.count()}")
print(f"Total de sub-setores: {SubSetor.objects.count()}")
print("="*50)
