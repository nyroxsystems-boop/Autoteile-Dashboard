import { useState, useEffect, useCallback } from 'react';
import { Building2, Users, Package, Tag, MessageCircle, Check, ArrowRight, SkipForward, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useI18n } from '../../i18n';
import { apiFetch } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  completed: boolean;
}

export function OnboardingWizard() {
  const _i18n = useI18n();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/api/dashboard/onboarding-status');
      const stepDefs: OnboardingStep[] = [
        { id: 'company_info', title: 'Firmendaten', description: 'Name, Adresse und Kontaktdaten Ihres Unternehmens', icon: <Building2 className="w-6 h-6" />, route: '/einstellungen', completed: data.steps?.company_info || false },
        { id: 'first_supplier', title: 'Erster Lieferant', description: 'Legen Sie Ihren ersten Lieferanten an', icon: <Users className="w-6 h-6" />, route: '/wawi/lieferanten', completed: data.steps?.first_supplier || false },
        { id: 'first_article', title: 'Erster Artikel', description: 'Erstellen Sie Ihren ersten Artikel im Lager', icon: <Package className="w-6 h-6" />, route: '/wawi/artikel', completed: data.steps?.first_article || false },
        { id: 'price_profile', title: 'Preisprofil', description: 'Richten Sie Ihre Margen und Preisregeln ein', icon: <Tag className="w-6 h-6" />, route: '/preisprofile', completed: data.steps?.price_profile || false },
        { id: 'whatsapp_connect', title: 'WhatsApp verbinden', description: 'Verbinden Sie Ihren WhatsApp Business Account', icon: <MessageCircle className="w-6 h-6" />, route: '/einstellungen', completed: data.steps?.whatsapp_connect || false },
      ];
      setSteps(stepDefs);
      setProgress(data.progress || 0);

      // Set current step to first incomplete
      const firstIncomplete = stepDefs.findIndex(s => !s.completed);
      setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : stepDefs.length);
    } catch {
      // Fallback
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSkip = async (stepId: string) => {
    try {
      await apiFetch('/api/dashboard/onboarding-step', {
        method: 'POST',
        body: JSON.stringify({ step: stepId, completed: true }),
      });
      loadStatus();
    } catch { /* ignore */ }
  };

  const handleGoToStep = (step: OnboardingStep) => {
    navigate(step.route);
  };

  const handleCompleteAll = async () => {
    for (const step of steps.filter(s => !s.completed)) {
      await handleSkip(step.id);
    }
    navigate('/heute');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Lade Einrichtungsassistent...</div>
      </div>
    );
  }

  const completedCount = steps.filter(s => s.completed).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Willkommen bei Partsunion
        </h1>
        <p className="text-lg text-muted-foreground">
          Richten Sie Ihr System in wenigen Schritten ein
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount} von {steps.length} Schritten abgeschlossen
          </span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`relative p-6 rounded-2xl border transition-all duration-300 ${
              step.completed
                ? 'bg-muted/30 border-green-500/30'
                : idx === currentStep
                  ? 'bg-card border-primary shadow-lg shadow-primary/5'
                  : 'bg-card border-border opacity-60'
            }`}
          >
            <div className="flex items-center gap-5">
              {/* Step Number / Check */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                step.completed
                  ? 'bg-green-500/10 text-green-500'
                  : idx === currentStep
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? <Check className="w-6 h-6" /> : step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {step.completed ? (
                  <span className="text-sm text-green-500 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Erledigt
                  </span>
                ) : idx === currentStep ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleSkip(step.id)} className="text-muted-foreground">
                      <SkipForward className="w-4 h-4 mr-1" /> Überspringen
                    </Button>
                    <Button onClick={() => handleGoToStep(step)} className="bg-primary text-white rounded-xl">
                      Einrichten <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All Done or Skip All */}
      <div className="mt-10 text-center">
        {allDone ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold">Einrichtung abgeschlossen!</h2>
            <p className="text-muted-foreground">Ihr System ist bereit. Viel Erfolg!</p>
            <Button onClick={() => navigate('/heute')} className="bg-primary text-white rounded-xl px-8">
              Zum Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="text-muted-foreground" onClick={handleCompleteAll}>
            Alle Schritte überspringen und später einrichten
          </Button>
        )}
      </div>
    </div>
  );
}
