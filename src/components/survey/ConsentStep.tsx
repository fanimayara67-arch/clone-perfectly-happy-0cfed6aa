import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { GraduationCap } from "lucide-react";

export interface ConsentData {
  participantName: string;
  identityDocument: string;
  consentCity: string;
  consentDate: string;
}

interface ConsentStepProps {
  onAccept: (data: ConsentData) => void;
  onDecline: () => void;
}

const today = new Date().toISOString().split("T")[0];

export const ConsentStep = ({ onAccept, onDecline }: ConsentStepProps) => {
  const [decision, setDecision] = useState<"accept" | "decline" | "">("");
  const [consentData, setConsentData] = useState<ConsentData>({
    participantName: "",
    identityDocument: "",
    consentCity: "Salvador",
    consentDate: today,
  });

  const consentComplete =
    consentData.participantName.trim().length >= 3 &&
    consentData.identityDocument.trim().length >= 3 &&
    consentData.consentCity.trim().length >= 2 &&
    !!consentData.consentDate;

  const handleContinue = () => {
    if (decision === "accept" && consentComplete) onAccept(consentData);
    if (decision === "decline") onDecline();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-hero rounded-3xl p-6 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
            Pesquisa Acadêmica · UNIFTC
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold leading-tight mb-2">
          Termo de Consentimento
        </h1>
        <p className="text-sm opacity-95 leading-relaxed">
          Trabalho de Conclusão de Curso
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden">
        <div className="border-b border-border/60 p-5">
          <h2 className="text-base font-bold text-foreground">
            TCLE - Termo de Consentimento Livre e Esclarecido
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Leia integralmente o termo antes de registrar sua decisão.
          </p>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5 space-y-4 text-sm leading-relaxed text-foreground">
          <p>
            O Sr.(a) está sendo convidado(a) para participar da pesquisa <strong>“Percepção de adultos sobre o uso de agonistas de GLP-1 para emagrecimento: Impactos estéticos faciais e corporais”</strong>. Nesta pesquisa pretendemos caracterizar a percepção de adultos sobre o uso de agonistas de GLP-1 para emagrecimento. O motivo que nos leva a estudar sobre o uso de agonistas do receptor de GLP-1 para emagrecimento se dá pelo crescimento desse uso nos últimos anos, principalmente devido à crescente divulgação. Com isso, percebe-se que seus efeitos não se limitam só à perda de peso, havendo também mudanças na aparência facial e corporal. Essas alterações podem influenciar diretamente como as pessoas percebem a própria autoimagem. Além disso, nem sempre esses efeitos são esperados ou compreendidos por quem utiliza esses fármacos. Por isso, compreender essas mudanças ajuda a ampliar o conhecimento sobre os impactos do tratamento, indo além da simples redução de peso. Para esta pesquisa adotaremos os seguintes procedimentos: O estudo será do tipo transversal e descritivo, com abordagem quantitativa e qualitativa, tendo como público-alvo adultos com 18 anos ou mais, residentes no estado da Bahia, que utilizaram agonistas de GLP-1 com objetivo de emagrecimento por pelo menos 3 meses. Serão excluídos indivíduos sem escolaridade, que tenham realizado procedimento estético facial/corporal recentemente, durante o mesmo período ou utilizaram concomitantemente outro medicamento para emagrecimento, garantindo que apenas participantes que atendam aos critérios de inclusão possam fornecer dados consistentes sobre o tema.
          </p>
          <p>
            E, para alcançar o público alvo da pesquisa será realizada a divulgação em redes sociais dos pesquisadores e de profissionais referência na área de emagrecimento, na Bahia, assim como a amostragem probabilística por bola de neve. A coleta ocorrerá final do mês de setembro de 2026, de forma online, via Google Forms, com o questionário sendo disponibilizado apenas após aceite do TCLE e seleção dos participantes com base nas respostas às perguntas, filtro iniciais, garantindo que apenas aqueles que atendam a todos os critérios de inclusão avancem para a seção principal do questionário, enquanto os demais receberão uma mensagem de exclusão.
          </p>
          <p>
            Como instrumento de coleta, será utilizado um formulário com 16 perguntas, dessas 6 objetivas e 10 subjetivas. O questionário abordará as percepções dos participantes sobre mudanças estéticas faciais e corporais após o uso de agonistas de GLP-1, incluindo avaliação das alterações visuais percebidas pelos participantes. Também será permitida a inclusão de comentários adicionais sobre suas experiências, garantindo uma visão completa da percepção individual.
          </p>
          <p>
            Os participantes podem apresentar desconforto emocional ou psicológico ao refletirem sobre sua imagem corporal e facial. Para minimizar esse risco, será garantido o direito de não responder perguntas que causem incômodo e de desistir da pesquisa a qualquer momento, sem prejuízo. E o(a) participante que deflagrar o risco de desconforto será encaminhado(a) para atendimento na clínica-escola de Psicologia da UNIFTC. Há também o risco de exposição de informações pessoais devido à coleta de dados online. Para reduzi-lo, as informações serão armazenadas de forma segura, com acesso restrito aos pesquisadores.
          </p>
          <p>
            Os resultados poderão contribuir para a compreensão das mudanças estéticas faciais e corporais percebidas por indivíduos que utilizam agonistas de GLP-1 para emagrecimento, ampliando o conhecimento sobre as experiências associadas a esse uso.
          </p>
          <p>
            Para participar deste estudo o(a) Sr.(a) não terá nenhum custo, nem receberá qualquer vantagem financeira. No entanto, caso o(a) Sr.(a), e seu acompanhante, tenha qualquer gasto pela sua participação na pesquisa, este deverá ser ressarcido pelo pesquisador, como por exemplo, gastos com alimentação e deslocamento. Caso o(a) Sr.(a) venha a sofrer qualquer tipo de dano resultante de sua participação na pesquisa o(a) Sr.(a) tem direito à indenização, por parte do pesquisador. O Sr.(a) terá o esclarecimento sobre o estudo em qualquer aspecto que desejar e estará livre para participar ou recusar-se a participar. Poderá retirar seu consentimento ou interromper a participação a qualquer momento. A sua participação é voluntária e a recusa em participar não acarretará qualquer penalidade ou modificação na forma em que é atendido pelo formulário eletrônico.
          </p>
          <p>
            Caso o (a) Sr.(a) tenha alguma dúvida ou necessite de qualquer esclarecimento ou ainda deseje retirar-se da pesquisa, por favor, entre em contato com os pesquisadores abaixo a qualquer tempo.
          </p>
          <p>
            <strong>Priscila Correia da Silva Ferraz – priscila.ferraz@ftc.edu.br</strong>
          </p>
          <p>
            Também em caso de dúvida, o(a) senhor(a) poderá entrar em contato com o Comitê de Ética em Pesquisa do Instituto Mantenedor de Ensino Superior (CEP/IMES/FTC). O Comitê de Ética em Pesquisa (CEP) busca defender os interesses dos participantes de pesquisa. O CEP é responsável pela avaliação e acompanhamento dos aspectos éticos de todas as pesquisas envolvendo seres humanos. O Comitê de Ética em Pesquisa do Instituto Mantenedor de Ensino Superior da Bahia (CEP/IMES) está localizado na Praça José Bastos, nº 55, Osvaldo Cruz, Itabuna- BA, 6º andar, CEP 45600-080. Horário de funcionamento: segunda a sexta-feira das 9h às 17h. Telefone: (73) 3214-2418 (Ramal: 2418). E-mail: cep@ftc.edu.br.
          </p>
          <p>
            Os resultados da pesquisa estarão à sua disposição quando finalizada, sendo enviado para seu email, informado no momento da coleta. Seu nome ou o material que indique sua participação não será liberado sem a sua permissão. O(a) Sr.(a) não será identificado em nenhuma publicação que possa resultar, estando o arquivo no aparelho pessoal das pesquisadoras, com senha para o acesso de qualquer dado.
          </p>
          <p>
            Este termo de consentimento encontra-se disponibilizado em formato digital, sendo aceito eletronicamente pelo(a) participante antes do início do formulário. Os dados e instrumentos utilizados na pesquisa ficarão arquivados com o pesquisador responsável por um período de cinco (5) anos, e após esse tempo serão destruídos. Os pesquisadores tratarão a sua identidade com padrões profissionais de sigilo, atendendo a legislação brasileira (Resolução Nº 466/12 do Conselho Nacional de Saúde), utilizando as informações somente para os fins acadêmicos e científicos.
          </p>
          <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 space-y-3">
            <p>
              Eu, <strong>{consentData.participantName.trim() || "participante"}</strong>, portador do documento de Identidade <strong>{consentData.identityDocument.trim() || "a informar"}</strong> fui informado (a) dos objetivos da pesquisa “Percepção de adultos sobre o uso de agonistas de GLP-1 para emagrecimento: Impactos estéticos faciais e corporais”, de maneira clara e detalhada e esclareci minhas dúvidas. Sei que a qualquer momento poderei solicitar novas informações e modificar minha decisão de participar se assim o desejar. Declaro que concordo em participar. Recebi uma via deste termo de consentimento livre e esclarecido e me foi dada à oportunidade de ler e esclarecer as minhas dúvidas.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="consent-name" className="text-xs font-semibold">Nome completo do participante</Label>
                <Input id="consent-name" value={consentData.participantName} onChange={(e) => setConsentData((current) => ({ ...current, participantName: e.target.value }))} placeholder="Digite seu nome completo" maxLength={120} className="h-11 bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consent-id" className="text-xs font-semibold">Documento de identidade</Label>
                <Input id="consent-id" value={consentData.identityDocument} onChange={(e) => setConsentData((current) => ({ ...current, identityDocument: e.target.value }))} placeholder="RG, CPF ou documento" maxLength={40} className="h-11 bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consent-city" className="text-xs font-semibold">Cidade do aceite</Label>
                <Input id="consent-city" value={consentData.consentCity} onChange={(e) => setConsentData((current) => ({ ...current, consentCity: e.target.value }))} maxLength={80} className="h-11 bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consent-date" className="text-xs font-semibold">Data do aceite eletrônico</Label>
                <Input id="consent-date" type="date" value={consentData.consentDate} onChange={(e) => setConsentData((current) => ({ ...current, consentDate: e.target.value }))} className="h-11 bg-background" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Instituto Mantenedor de Ensino Superior da Bahia - IMES · Avenida Luís Viana Filho, 8812, Paralela, - FTC- Módulo 1, Nível 3. · Telefone: (71) 3281-8214. E-mail: cep@ftc.edu.br
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/60 space-y-4">
        <RadioGroup value={decision} onValueChange={(v) => setDecision(v as "accept" | "decline")}> 
          <label className="flex items-start gap-3 rounded-xl border-2 border-border bg-card p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="accept" id="consent-accept" className="mt-0.5" />
            <Label htmlFor="consent-accept" className="text-sm font-semibold leading-relaxed cursor-pointer">
              Li o termo e aceito participar da pesquisa
            </Label>
          </label>
          <label className="flex items-start gap-3 rounded-xl border-2 border-border bg-card p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 mt-3">
            <RadioGroupItem value="decline" id="consent-decline" className="mt-0.5" />
            <Label htmlFor="consent-decline" className="text-sm font-semibold leading-relaxed cursor-pointer">
              Não aceito participar da pesquisa
            </Label>
          </label>
        </RadioGroup>
        <Button
          onClick={handleContinue}
          disabled={!decision || (decision === "accept" && !consentComplete)}
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-primary hover:opacity-95 shadow-soft disabled:opacity-50"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
