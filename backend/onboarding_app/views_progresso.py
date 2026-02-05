"""
View para salvar progresso de atividades
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Atividade, Progresso, Modulo


class ModuloAtividadesView(APIView):
    """
    GET /api/modulos/{id_modulo}/atividades/
    Retorna todas as atividades de um módulo
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id_modulo):
        try:
            modulo = Modulo.objects.get(id_modulo=id_modulo)
            atividades = Atividade.objects.filter(id_modulo=modulo).values(
                'id_atividade', 'titulo', 'descricao', 'ordem'
            )
            
            # Adicionar informação do quiz se existir
            result = []
            for ativ in atividades:
                ativ_obj = Atividade.objects.get(id_atividade=ativ['id_atividade'])
                ativ_dict = dict(ativ)
                
                # Verificar se tem quiz associado
                if hasattr(ativ_obj, 'quiz'):
                    try:
                        quiz = ativ_obj.quiz
                        ativ_dict['quiz'] = {
                            'id_quiz': quiz.id_quiz,
                            'titulo': quiz.titulo
                        }
                    except:
                        pass
                
                result.append(ativ_dict)
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Modulo.DoesNotExist:
            return Response({"error": "Módulo não encontrado"}, status=status.HTTP_404_NOT_FOUND)


class SalvarProgressoView(APIView):
    """
    POST /api/progresso/salvar/
    Salva ou atualiza o progresso de uma atividade para um usuário
    
    Body (opção 1 - direto com id_atividade):
    {
        "id_atividade": 123
    }
    
    Body (opção 2 - via material):
    {
        "id_material": 45,
        "tipo_material": "video"  // ou "pdf", "leitura", "quiz"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"🔍 [SalvarProgressoView] Recebida requisição")
        print(f"📨 request.data: {request.data}")
        print(f"👤 request.user: {request.user}")
        
        id_atividade = request.data.get('id_atividade')
        id_material = request.data.get('id_material')
        tipo_material = request.data.get('tipo_material')
        
        print(f"📝 id_atividade: {id_atividade}")
        print(f"📝 id_material: {id_material}, tipo: {tipo_material}")
        
        atividade = None
        
        # Opção 1: id_atividade direto
        if id_atividade:
            try:
                print(f"🔎 Buscando Atividade.objects.get(id_atividade={id_atividade})")
                atividade = Atividade.objects.get(id_atividade=id_atividade)
                print(f"✅ Atividade encontrada: {atividade.titulo}")
            except Atividade.DoesNotExist:
                print(f"❌ Atividade {id_atividade} NÃO ENCONTRADA")
                pass
        
        # Opção 2: id_material + tipo_material
        if not atividade and id_material and tipo_material:
            try:
                print(f"🔎 Buscando atividade via material {tipo_material} #{id_material}")
                
                if tipo_material == 'video':
                    from .models import MaterialVideo
                    material = MaterialVideo.objects.get(id_material=id_material)
                    atividade = material.id_atividade
                    print(f"✅ Atividade encontrada via MaterialVideo: {atividade.titulo}")
                    
                elif tipo_material == 'pdf':
                    from .models import MaterialPDF
                    material = MaterialPDF.objects.get(id_material=id_material)
                    atividade = material.id_atividade
                    print(f"✅ Atividade encontrada via MaterialPDF: {atividade.titulo}")
                    
                elif tipo_material == 'leitura' or tipo_material == 'reading':
                    from .models import MaterialLeitura
                    material = MaterialLeitura.objects.get(id_material=id_material)
                    atividade = material.id_atividade
                    print(f"✅ Atividade encontrada via MaterialLeitura: {atividade.titulo}")
                    
                elif tipo_material == 'quiz':
                    from .models import Quiz
                    quiz = Quiz.objects.get(id_quiz=id_material)
                    atividade = quiz.id_atividade
                    print(f"✅ Atividade encontrada via Quiz: {atividade.titulo}")
                    
            except Exception as e:
                print(f"❌ Erro ao buscar material: {str(e)}")
                pass
        
        # Validar se encontrou a atividade
        if not atividade:
            error_msg = "Nenhuma atividade encontrada. Forneça 'id_atividade' ou ('id_material' + 'tipo_material')"
            print(f"❌ {error_msg}")
            print(f"🔍 Listando primeiras 10 atividades no banco:")
            todas = Atividade.objects.all().values_list('id_atividade', 'titulo')[:10]
            for ativ_id, titulo in todas:
                print(f"   - {ativ_id}: {titulo}")
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            usuario = request.user
            
            # Verificar se o usuário está em modo visualização (trilha finalizada)
            from .models import Matricula
            modulo = atividade.id_modulo
            trilha = modulo.id_trilha
            
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
                
                # Bloquear progresso se estiver em modo visualização
                if matricula.modo_visualizacao:
                    print(f"🔒 Usuário em modo visualização - bloqueando registro de progresso")
                    return Response({
                        "error": "Trilha finalizada",
                        "message": "Esta trilha já foi concluída. Você está em modo visualização apenas.",
                        "modo_visualizacao": True,
                        "progresso_percentual": matricula.calcular_progresso_percentual(),
                        "data_conclusao": matricula.data_fim.isoformat() if matricula.data_fim else None
                    }, status=status.HTTP_403_FORBIDDEN)
                    
            except Matricula.DoesNotExist:
                print(f"⚠️ Matrícula não encontrada - permitindo progresso")
                pass
            
            # Criar ou atualizar progresso
            progresso, created = Progresso.objects.get_or_create(
                id_usuario=usuario,
                id_atividade=atividade,
                defaults={'completed_at': timezone.now()}
            )
            
            print(f"💾 Progresso {'criado' if created else 'já existia'} - ID: {progresso.id_progresso}")
            
            if not created and not progresso.completed_at:
                progresso.completed_at = timezone.now()
                progresso.save()
            
            # Após salvar progresso, verificar se a trilha foi finalizada
            try:
                matricula = Matricula.objects.get(id_usuario=usuario, id_trilha=trilha)
                trilha_finalizada = matricula.verificar_e_finalizar_trilha()
                
                if trilha_finalizada:
                    print(f"🎉 Trilha finalizada! Modo visualização: {matricula.modo_visualizacao}")
            except Matricula.DoesNotExist:
                pass
            
            return Response({
                "message": "Progresso salvo com sucesso",
                "id_progresso": progresso.id_progresso,
                "id_atividade": atividade.id_atividade,
                "atividade_titulo": atividade.titulo,
                "completed_at": progresso.completed_at.isoformat() if progresso.completed_at else None,
                "criado_agora": created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erro ao salvar progresso: {str(e)}")
            return Response(
                {"error": f"Erro ao salvar progresso: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
