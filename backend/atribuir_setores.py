from users.models import User, Setor, SubSetor

print("Atribuindo setores aos usuários...")
print("=" * 50)

# Pegar os setores e subsetores
ti = Setor.objects.get(nome="Tecnologia da Informação")
ti_dev = SubSetor.objects.get(setor=ti, nome="Desenvolvimento")
ti_infra = SubSetor.objects.get(setor=ti, nome="Infraestrutura")

rh = Setor.objects.get(nome="Recursos Humanos")
rh_rec = SubSetor.objects.get(setor=rh, nome="Recrutamento")
rh_trein = SubSetor.objects.get(setor=rh, nome="Treinamento")

fin = Setor.objects.get(nome="Financeiro")
fin_cont = SubSetor.objects.get(setor=fin, nome="Contabilidade")

ops = Setor.objects.get(nome="Operações")
ops_log = SubSetor.objects.get(setor=ops, nome="Logística")

# Atribuir setores aos usuários sem setor
usuarios_sem_setor = User.objects.filter(setor__isnull=True)

# Distribuir usuários entre os setores
distribuicao = [
    (ti, ti_dev),
    (rh, rh_trein),
    (fin, fin_cont),
    (ops, ops_log),
    (ti, ti_infra),
    (rh, rh_rec),
    (ti, ti_dev),
]

for i, user in enumerate(usuarios_sem_setor):
    if i < len(distribuicao):
        setor, subsetor = distribuicao[i]
    else:
        # Se tiver mais usuários, distribuir aleatoriamente
        setor, subsetor = distribuicao[i % len(distribuicao)]
    
    user.setor = setor
    user.subsetor = subsetor
    
    # Se não tiver cargo, atribuir um cargo genérico
    if not user.cargo:
        user.cargo = "Colaborador"
    
    user.save()
    print(f"✓ {user.username} ({user.email})")
    print(f"  → Setor: {setor.nome}")
    print(f"  → Sub-setor: {subsetor.nome}")
    print(f"  → Cargo: {user.cargo}")
    print()

print("=" * 50)
print(f"Total de usuários atualizados: {usuarios_sem_setor.count()}")
print()

# Verificar se ainda há usuários sem setor
usuarios_ainda_sem_setor = User.objects.filter(setor__isnull=True).count()
print(f"Usuários sem setor: {usuarios_ainda_sem_setor}")
print("=" * 50)
