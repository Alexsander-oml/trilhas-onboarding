from django.apps import AppConfig


class OnboardingAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'onboarding_app'
    verbose_name = 'Onboarding App'

    def ready(self):
        """
        Importa signals quando a aplicação está pronta.
        Isso garante que os gatilhos imediatos sejam registrados.
        """
        import onboarding_app.signals  # noqa
