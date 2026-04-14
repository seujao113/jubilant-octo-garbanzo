import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import './App.css';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Droplets, PrinterIcon, RotateCcw, Sparkles, Target } from 'lucide-react';

interface FormData {
  objetivoPrincipal?: string;
  nivelAtividade?: string;
  peso?: string;
  altura?: string;
  idade?: string;
  restricaoAlimentar?: string;
  outraRestricao?: string;
  alimentoIndispensavel?: string;
}

interface MealDetail {
  calories: number;
  suggestion: string;
  time: string;
}

interface PlannerResult {
  dailyCalories: number;
  waterIntake: number;
  meals: {
    [key: string]: MealDetail;
    cafeDaManha: MealDetail;
    almoco: MealDetail;
    lancheTarde: MealDetail;
    jantar: MealDetail;
  };
  formDataSnapshot: FormData;
  weeklyPlan?: { [day: string]: { meals: { [mealName: string]: MealDetail } } };
}

const TOTAL_STEPS = 7;

const calcularTMB = (peso: number, altura: number, idade: number): number => {
  return (10 * peso) + (6.25 * altura) - (5 * idade) - 78;
};

const calcularCaloriasAtividade = (tmb: number, nivelAtividade?: string): number => {
  let fatorAtividade = 1.2;
  switch (nivelAtividade) {
    case "levemente_ativo": fatorAtividade = 1.375; break;
    case "ativo": fatorAtividade = 1.55; break;
    case "muito_ativo": fatorAtividade = 1.725; break;
    default: fatorAtividade = 1.2; break;
  }
  return tmb * fatorAtividade;
};

const ajustarCaloriasObjetivo = (caloriasBase: number, objetivoPrincipal?: string): number => {
  switch (objetivoPrincipal) {
    case "perder_peso": return caloriasBase - 500;
    case "ganhar_massa":
    case "ganhar_peso": return caloriasBase + 300;
    default: return caloriasBase;
  }
};

const calcularAgua = (peso: number): number => {
  return Math.round(peso * 35);
};

const mealSuggestions: { [key: string]: string[] } = {
  cafeDaManha: [
    "Iogurte natural com frutas e granola",
    "Ovos mexidos com pão integral e uma fruta",
    "Vitamina de frutas com aveia e sementes de chia",
    "Tapioca com queijo branco e tomate",
    "Panqueca de banana com aveia e canela"
  ],
  almoco: [
    "Salada colorida com frango grelhado e quinoa",
    "Peixe assado com batata doce e legumes no vapor",
    "Lentilha com arroz integral e salada de folhas verdes",
    "Carne moída com purê de mandioquinha e brócolis",
    "Wrap integral com atum, vegetais e homus"
  ],
  lancheTarde: [
    "Mix de castanhas e uma fruta",
    "Iogurte com mel e nozes",
    "Palitos de cenoura e pepino com pasta de amendoim",
    "Biscoito de arroz com abacate e tomate cereja",
    "Uma porção de frutas secas (damasco, ameixa)"
  ],
  jantar: [
    "Sopa de legumes com croutons integrais",
    "Omelete com cogumelos e salada",
    "Salmão grelhado com aspargos e arroz selvagem",
    "Frango desfiado com legumes salteados",
    "Creme de abóbora com gengibre e sementes de girassol"
  ]
};

const stepTitles = [
  "Objetivo",
  "Rotina",
  "Peso",
  "Altura",
  "Idade",
  "Restrições",
  "Preferências"
];

const labelByMeal: Record<string, string> = {
  cafeDaManha: "Café da manhã",
  almoco: "Almoço",
  lancheTarde: "Lanche da tarde",
  jantar: "Jantar"
};

const getRandomSuggestion = (mealType: string, restrictions?: string, preferences?: string): string => {
  const suggestions = mealSuggestions[mealType] || ["Opção padrão para esta refeição."];
  let suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  if (restrictions && restrictions !== "nenhuma" && restrictions !== "outras") {
    suggestion += ` (Atenção: ${restrictions})`;
  }
  if (preferences) {
    suggestion += ` (Lembre-se de: ${preferences})`;
  }
  return suggestion;
};

const gerarPlanoAlimentar = (data: FormData): PlannerResult | null => {
  const peso = parseFloat(data.peso || "0");
  const altura = parseFloat(data.altura || "0");
  const idade = parseInt(data.idade || "0", 10);

  if (!peso || !altura || !idade || !data.nivelAtividade || !data.objetivoPrincipal) {
    alert("Por favor, preencha todos os campos obrigatórios para gerar o plano.");
    return null;
  }

  const tmb = calcularTMB(peso, altura, idade);
  const caloriasComAtividade = calcularCaloriasAtividade(tmb, data.nivelAtividade);
  const dailyCalories = ajustarCaloriasObjetivo(caloriasComAtividade, data.objetivoPrincipal);
  const waterIntake = calcularAgua(peso);

  const mealDistribution = {
    cafeDaManha: 0.25,
    almoco: 0.35,
    lancheTarde: 0.15,
    jantar: 0.25
  };

  const meals: PlannerResult['meals'] = {
    cafeDaManha: { calories: 0, suggestion: '', time: "08:00" },
    almoco: { calories: 0, suggestion: '', time: "12:30" },
    lancheTarde: { calories: 0, suggestion: '', time: "16:00" },
    jantar: { calories: 0, suggestion: '', time: "19:30" }
  };

  const weeklyPlan: PlannerResult['weeklyPlan'] = {};
  const daysOfWeek = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

  daysOfWeek.forEach(day => {
    weeklyPlan[day] = { meals: {} };
    for (const mealType in mealDistribution) {
      const mealCalories = dailyCalories * (mealDistribution as Record<string, number>)[mealType];
      const suggestion = getRandomSuggestion(mealType, data.restricaoAlimentar === "outras" ? data.outraRestricao : data.restricaoAlimentar, data.alimentoIndispensavel);
      const time = (meals as Record<string, MealDetail>)[mealType].time;

      (weeklyPlan[day].meals as Record<string, MealDetail>)[mealType] = {
        calories: Math.round(mealCalories),
        suggestion,
        time
      };

      if (day === "Segunda-feira") {
        (meals as Record<string, MealDetail>)[mealType] = { calories: Math.round(mealCalories), suggestion, time };
      }
    }
  });

  return {
    dailyCalories: Math.round(dailyCalories),
    waterIntake,
    meals,
    weeklyPlan,
    formDataSnapshot: data
  };
};

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [plannerData, setPlannerData] = useState<PlannerResult | null>(null);
  const plannerRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const printContents = plannerRef.current?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (!printContents) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.height = '0px';
    iframe.style.width = '0px';
    iframe.style.position = 'absolute';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Plano Alimentar</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; color: #111827; }
            .print-header { text-align: center; margin-bottom: 24px; }
            .print-header h1 { color: #0f172a; margin: 0 0 8px; }
            .print-header p { color: #475569; margin: 0; }
            .print-card { border: 1px solid #e5e7eb; border-radius: 16px; margin-bottom: 15px; padding: 15px; page-break-inside: avoid; }
            .print-card-title { font-size: 1.1em; font-weight: bold; color: #111827; margin-bottom: 5px; }
            .print-card-desc { font-size: 0.9em; color: #6b7280; margin-bottom: 10px; }
            .print-meal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; }
            .print-day-title { font-size: 1.2em; color: #0f172a; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; }
            .print-water-calories { text-align: center; margin-bottom: 20px; font-size: 1.05em; }
            .print-water-calories span { font-weight: bold; }
            .print-footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Planner Alimentar Inteligente</h1>
            <p>Seu plano alimentar personalizado.</p>
          </div>
          ${printContents}
          <div class="print-footer">
            <p>&copy; ${new Date().getFullYear()} Planner Alimentar Inteligente.</p>
            <p>Este é um protótipo e não substitui aconselhamento profissional.</p>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    const result = gerarPlanoAlimentar(formData);
    if (result) {
      setPlannerData(result);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="objetivoPrincipal" className="text-lg font-medium text-slate-900">Qual seu objetivo principal?</Label>
            <RadioGroup id="objetivoPrincipal" value={formData.objetivoPrincipal} onValueChange={(value) => handleChange("objetivoPrincipal", value)} className="space-y-3">
              <div className="option-row"><RadioGroupItem value="perder_peso" id="perder_peso" /><Label htmlFor="perder_peso">Perder peso</Label></div>
              <div className="option-row"><RadioGroupItem value="ganhar_massa" id="ganhar_massa" /><Label htmlFor="ganhar_massa">Ganhar massa muscular</Label></div>
              <div className="option-row"><RadioGroupItem value="ganhar_peso" id="ganhar_peso" /><Label htmlFor="ganhar_peso">Ganhar peso</Label></div>
              <div className="option-row"><RadioGroupItem value="manter_forma" id="manter_forma" /><Label htmlFor="manter_forma">Manter forma atual</Label></div>
            </RadioGroup>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="nivelAtividade" className="text-lg font-medium text-slate-900">Qual seu nível de atividade física?</Label>
            <Select value={formData.nivelAtividade} onValueChange={(value) => handleChange("nivelAtividade", value)}>
              <SelectTrigger id="nivelAtividade"><SelectValue placeholder="Selecione seu nível de atividade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário</SelectItem>
                <SelectItem value="levemente_ativo">Levemente ativo</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="muito_ativo">Muito ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="peso" className="text-lg font-medium text-slate-900">Qual seu peso atual? (kg)</Label>
            <Input id="peso" type="number" value={formData.peso || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("peso", e.target.value)} placeholder="Ex: 70" />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="altura" className="text-lg font-medium text-slate-900">Qual sua altura? (cm)</Label>
            <Input id="altura" type="number" value={formData.altura || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("altura", e.target.value)} placeholder="Ex: 175" />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="idade" className="text-lg font-medium text-slate-900">Qual sua idade?</Label>
            <Input id="idade" type="number" value={formData.idade || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("idade", e.target.value)} placeholder="Ex: 30" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="restricaoAlimentar" className="text-lg font-medium text-slate-900">Possui alguma restrição alimentar?</Label>
            <Select value={formData.restricaoAlimentar} onValueChange={(value) => handleChange("restricaoAlimentar", value)}>
              <SelectTrigger id="restricaoAlimentar"><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                <SelectItem value="lactose">Lactose</SelectItem>
                <SelectItem value="gluten">Glúten</SelectItem>
                <SelectItem value="veganismo">Veganismo</SelectItem>
                <SelectItem value="outras">Outras</SelectItem>
              </SelectContent>
            </Select>
            {formData.restricaoAlimentar === 'outras' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="outraRestricao" className="text-md font-medium text-slate-900">Especifique sua restrição:</Label>
                <Textarea id="outraRestricao" value={formData.outraRestricao || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange("outraRestricao", e.target.value)} placeholder="Descreva sua restrição alimentar aqui..." className="mt-1" />
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <Label htmlFor="alimentoIndispensavel" className="text-lg font-medium text-slate-900">Algum alimento indispensável para você?</Label>
            <Textarea id="alimentoIndispensavel" value={formData.alimentoIndispensavel || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange("alimentoIndispensavel", e.target.value)} placeholder="Ex: Café pela manhã, uma fruta específica, etc." />
          </div>
        );
      default:
        return <div>Etapa {currentStep} em construção...</div>;
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-orb orb-one" />
      <div className="bg-orb orb-two" />

      <header className="hero-block">
        <span className="hero-pill"><Sparkles className="h-4 w-4" /> Design renovado</span>
        <h1>Planner Alimentar Inteligente</h1>
        <p>
          Uma experiência mais elegante e clara para montar seu plano alimentar — com visual premium, foco e simplicidade.
        </p>
      </header>

      <main className="glass-panel">
        {plannerData ? (
          <div ref={plannerRef} className="planner-results space-y-6">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="text-center px-0">
                <CardTitle className="text-slate-900 text-3xl">Seu Plano Semanal</CardTitle>
                <CardDescription className="text-slate-600 text-base">Baseado nos seus dados e objetivo.</CardDescription>
                <div className="stats-grid mt-4">
                  <div className="stat-card">
                    <Target className="h-5 w-5 text-slate-700" />
                    <p className="stat-label">Calorias diárias</p>
                    <p className="stat-value">{plannerData.dailyCalories} kcal</p>
                  </div>
                  <div className="stat-card">
                    <Droplets className="h-5 w-5 text-slate-700" />
                    <p className="stat-label">Água diária</p>
                    <p className="stat-value">{(plannerData.waterIntake / 1000).toFixed(1)} L</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 px-0">
                {plannerData.weeklyPlan && Object.entries(plannerData.weeklyPlan).map(([day, dayPlan]) => (
                  <section key={day} className="day-block">
                    <h3>{day}</h3>
                    <div className="meal-grid">
                      {Object.entries(dayPlan.meals).map(([mealName, mealDetails]) => (
                        <Card key={mealName} className="meal-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-900">
                              {labelByMeal[mealName] || mealName}
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-500">
                              {mealDetails.time} · {mealDetails.calories} kcal
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-slate-700 text-sm leading-relaxed">{mealDetails.suggestion}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </CardContent>

              <CardFooter className="actions-row">
                <Button onClick={handlePrint} className="btn-primary">
                  <PrinterIcon className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
                </Button>
                <Button onClick={() => { setPlannerData(null); setCurrentStep(1); setFormData({}); }} className="btn-secondary">
                  <RotateCcw className="mr-2 h-4 w-4" /> Criar novo plano
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            <section className="form-stage">
              <div className="step-header">
                <p className="step-counter">Passo {currentStep} de {TOTAL_STEPS}</p>
                <h2>{stepTitles[currentStep - 1]}</h2>
                <p>Responda para personalizar seu plano com mais precisão.</p>
              </div>
              {renderStep()}
            </section>

            <div className={`actions-row ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
              {currentStep > 1 && (
                <Button type="button" onClick={handlePrev} className="btn-ghost">Anterior</Button>
              )}
              <Button type="submit" className="btn-primary">
                {currentStep === TOTAL_STEPS ? 'Gerar plano alimentar' : 'Próximo'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="progress-track" aria-hidden>
              <div className="progress-fill" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
            </div>
          </form>
        )}
      </main>

      <footer className="footer-note">
        <p>&copy; {new Date().getFullYear()} Planner Alimentar Inteligente.</p>
        <p>Protótipo para apoio — não substitui orientação de profissional de saúde.</p>
      </footer>
    </div>
  );
}

export default App;
