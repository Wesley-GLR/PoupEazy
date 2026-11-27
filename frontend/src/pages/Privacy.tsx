import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import logoHorizontal from '../assets/logo-horizontal.png'

const contactEmail = 'poupeazy@gmail.com'
const contactLink = `mailto:${contactEmail}?subject=${encodeURIComponent('Privacidade e dados pessoais — PoupEazy')}`
const sections = [
  ['sobre', 'Sobre o projeto'],
  ['dados', 'Dados que utilizamos'],
  ['finalidades', 'Como usamos os dados'],
  ['servicos', 'Integrações e serviços externos'],
  ['seguranca', 'Segurança e armazenamento no dispositivo'],
  ['retencao', 'Retenção e exclusão'],
  ['direitos', 'Suas escolhas e seus direitos'],
  ['contato', 'Contato e atualizações'],
] as const

const dataGroups = [
  {
    title: 'Conta e perfil',
    description: 'Nome, e-mail, identificador da conta, telefone quando informado, senha protegida por hash e dados de confirmação de e-mail, recuperação de senha e sessão.',
  },
  {
    title: 'Organização financeira',
    description: 'Receitas, despesas, descrições, valores, datas, categorias, origem e situação dos lançamentos; orçamentos, metas, prazos, aportes e retiradas registrados no PoupEazy.',
  },
  {
    title: 'Preferências e comunicações',
    description: 'Opções e limites dos alertas de e-mail, eventos necessários para evitar avisos repetidos, período e seções de relatórios solicitados e informações sobre o processamento dos envios.',
  },
  {
    title: 'Integrações opcionais',
    description: 'Identificadores e informações das conexões e dos dados importados pelo Open Finance; número vinculado ao WhatsApp, mensagens enviadas ao serviço, rascunhos de lançamentos, confirmações e respostas.',
  },
  {
    title: 'Funcionamento e suporte',
    description: 'Registros de erros e informações técnicas necessárias para operar o serviço. Provedores de infraestrutura também podem processar endereço IP e informações das requisições. Se você entrar em contato, trataremos o endereço de contato e o conteúdo da solicitação.',
  },
]

const headingClass = 'text-xl font-bold text-text-dark sm:text-2xl'
const paragraphClass = 'mt-4 leading-relaxed text-muted'
const listClass = 'mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted'
const linkClass = 'font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'

export default function Privacy() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Política de Privacidade | PoupEazy'
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    return () => { document.title = previousTitle }
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      <a href="#conteudo-privacidade" className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-primary p-3 font-semibold text-white focus:not-sr-only">Ir para o conteúdo</a>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" aria-label="PoupEazy — página inicial"><img src={logoHorizontal} alt="PoupEazy" className="h-10 w-auto sm:h-12" /></Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Voltar ao início</Link>
        </div>
      </header>

      <main id="conteudo-privacidade" className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"><ShieldCheck size={17} aria-hidden="true" /> PoupEazy e seus dados</div>
          <h1 className="text-3xl font-bold text-text-dark sm:text-4xl">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-muted">Última atualização: <time dateTime="2026-11-27">27 de novembro de 2026</time></p>
          <p className={paragraphClass}>Esta política explica como a Equipe do projeto acadêmico PoupEazy trata dados no site, no aplicativo e nas funcionalidades associadas. Nosso contato de privacidade é <a href={contactLink} className={`${linkClass} break-all`}>{contactEmail}</a>.</p>
        </div>

        <nav aria-label="Nesta política" className="mb-8 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-bold text-text-dark">Nesta página</h2>
          <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {sections.map(([id, title], index) => <li key={id}><a href={`#${id}`} className="font-semibold text-primary hover:underline">{index + 1}. {title}</a></li>)}
          </ol>
        </nav>

        <article className="space-y-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-9">
          <section id="sobre" className="scroll-mt-6" aria-labelledby="sobre-titulo">
            <h2 id="sobre-titulo" className={headingClass}>1. Sobre o projeto</h2>
            <p className={paragraphClass}>O PoupEazy é um projeto de faculdade para registrar e acompanhar finanças pessoais. Ele organiza informações, orçamentos e metas; não executa pagamentos, transferências, investimentos ou outras movimentações de dinheiro.</p>
            <p className={paragraphClass}>Informações de cadastro, registros inseridos ou importados e mensagens podem ser dados pessoais. Tratamos essas informações conforme esta política também durante atividades acadêmicas e testes.</p>
          </section>

          <section id="dados" className="scroll-mt-6" aria-labelledby="dados-titulo">
            <h2 id="dados-titulo" className={headingClass}>2. Dados que utilizamos</h2>
            <dl className="mt-5 space-y-5">
              {dataGroups.map(group => <div key={group.title}><dt className="font-semibold text-text-dark">{group.title}</dt><dd className="mt-1.5 leading-relaxed text-muted">{group.description}</dd></div>)}
            </dl>
            <p className={paragraphClass}>Forneça apenas as informações necessárias. Evite incluir senhas bancárias, documentos ou dados de outras pessoas nos campos livres e nas mensagens ao projeto.</p>
          </section>

          <section id="finalidades" className="scroll-mt-6" aria-labelledby="finalidades-titulo">
            <h2 id="finalidades-titulo" className={headingClass}>3. Como usamos os dados</h2>
            <ul className={listClass}>
              <li>Criar e autenticar sua conta, manter o perfil e permitir a organização dos registros financeiros.</li>
              <li>Confirmar o e-mail, recuperar o acesso e enviar comunicações de segurança, como aviso de alteração de senha.</li>
              <li>Enviar os alertas opcionais que você ativar e os relatórios que solicitar, conforme suas escolhas de conteúdo, formato e período.</li>
              <li>Executar as integrações que você escolher utilizar, atender solicitações e investigar falhas ou uso indevido.</li>
            </ul>
            <p className={paragraphClass}>Nesta versão, não utilizamos anúncios nem rastreamento publicitário e não comercializamos os dados pessoais. A equipe pode acessar dados quando necessário para manutenção, segurança e atendimento do projeto.</p>
          </section>

          <section id="servicos" className="scroll-mt-6" aria-labelledby="servicos-titulo">
            <h2 id="servicos-titulo" className={headingClass}>4. Integrações e serviços externos</h2>
            <ul className={listClass}>
              <li><strong className="text-text-dark">Hospedagem e banco de dados:</strong> utilizamos Vercel para o site, Render para a API e Neon para armazenar os dados. Esses serviços processam as informações necessárias à operação e à infraestrutura.</li>
              <li><strong className="text-text-dark">E-mail:</strong> Google/Gmail processa destinatário, assunto, conteúdo e anexos para enviar as mensagens do projeto. Seu provedor de e-mail também recebe essas informações. Relatórios contêm as seções que você selecionar e são enviados ao e-mail confirmado da própria conta.</li>
              <li><strong className="text-text-dark">Open Finance:</strong> ao utilizar a integração com a Pluggy, são tratados identificadores da conexão e os dados disponibilizados pelo serviço, como instituição, contas e transações, para importação e organização no PoupEazy. Essa integração não autoriza o PoupEazy a movimentar dinheiro.</li>
              <li><strong className="text-text-dark">WhatsApp:</strong> ao vincular e utilizar esse canal, seu número, mensagens e respostas passam pelo WhatsApp/Meta e pelo provedor técnico da integração, que pode ser a Vonage. O conteúdo é processado para confirmar lançamentos e responder às consultas solicitadas.</li>
            </ul>
            <p className={paragraphClass}>As integrações com Open Finance e WhatsApp são opcionais. Elas envolvem serviços externos com suas próprias condições de uso e privacidade. A infraestrutura desses fornecedores pode processar dados fora do Brasil; não garantimos armazenamento exclusivamente nacional.</p>
            <p className={paragraphClass}>Solicitar um relatório por e-mail cria uma cópia das informações na sua caixa de entrada. Proteja essa caixa e confira o conteúdo antes de encaminhar os arquivos a outras pessoas.</p>
          </section>

          <section id="seguranca" className="scroll-mt-6" aria-labelledby="seguranca-titulo">
            <h2 id="seguranca-titulo" className={headingClass}>5. Segurança e armazenamento no dispositivo</h2>
            <p className={paragraphClass}>Utilizamos autenticação e controles de acesso por conta. As senhas são armazenadas como hash, e os links de confirmação e recuperação têm validade limitada. O acesso aos serviços publicados utiliza HTTPS. Essas medidas reduzem riscos, mas nenhum serviço é totalmente livre de falhas.</p>
            <p className={paragraphClass}>No site, um identificador de sessão é salvo no armazenamento local do navegador para manter o acesso. No aplicativo Android, a credencial de sessão é guardada no armazenamento seguro do dispositivo. Ao sair da conta, a credencial local é removida. Não compartilhamos a senha do PoupEazy com as integrações.</p>
          </section>

          <section id="retencao" className="scroll-mt-6" aria-labelledby="retencao-titulo">
            <h2 id="retencao-titulo" className={headingClass}>6. Retenção e exclusão</h2>
            <p className={paragraphClass}>Mantemos o cadastro, o histórico financeiro e as preferências enquanto sua conta existir, para disponibilizar essas funcionalidades. O projeto não apaga automaticamente contas por inatividade. Registros de processamento de alertas são mantidos para evitar notificações repetidas.</p>
            <p className={paragraphClass}>Os arquivos PDF e CSV dos relatórios são gerados temporariamente em memória para envio; a API não mantém uma biblioteca desses arquivos. As cópias enviadas permanecem nos serviços de e-mail. Gráficos enviados pelo WhatsApp podem ficar temporariamente disponíveis por até dez minutos.</p>
            <p className={paragraphClass}>Você pode excluir sua conta em <Link to="/excluir-conta" className={linkClass}>Excluir conta e dados</Link>, inclusive sem instalar o aplicativo. Após confirmar sua identidade e concluir o formulário, a conta e seus dados associados são removidos da base ativa do PoupEazy, incluindo perfil, registros financeiros, orçamentos, metas, categorias pessoais, preferências, filas e vínculos locais.</p>
            <p className={paragraphClass}>Esse procedimento não apaga automaticamente e-mails ou mensagens já entregues, conexões e registros mantidos nos serviços externos, gráficos temporários já gerados ou cópias de segurança e registros técnicos dos provedores. A remoção local também não equivale à revogação de uma conexão diretamente no provedor.</p>
            <p className={paragraphClass}>Backups e registros técnicos seguem os controles e períodos de retenção dos serviços de infraestrutura. Para esclarecer o alcance da exclusão, solicitar providências sobre dados mantidos por terceiros ou tratar informações enviadas ao suporte, entre em contato com a equipe. Não prometemos apagamento imediato dessas cópias.</p>
          </section>

          <section id="direitos" className="scroll-mt-6" aria-labelledby="direitos-titulo">
            <h2 id="direitos-titulo" className={headingClass}>7. Suas escolhas e seus direitos</h2>
            <p className={paragraphClass}>Você pode editar nome e telefone no perfil, controlar os alertas nas preferências de e-mail, escolher o conteúdo dos relatórios, desvincular o WhatsApp e gerenciar as integrações disponíveis. Desativar alertas opcionais não impede as comunicações necessárias de autenticação e segurança.</p>
            <p className={paragraphClass}>Pelo contato abaixo, você pode pedir confirmação e acesso aos seus dados, correção, informações sobre o tratamento e os destinatários, portabilidade quando aplicável e exclusão ou outras providências previstas na legislação. Para proteger sua conta, podemos solicitar informações proporcionais para verificar sua identidade. Nunca envie sua senha por e-mail.</p>
            <p className={paragraphClass}>Saiba mais sobre os direitos previstos na LGPD na <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" className={linkClass}>página da Autoridade Nacional de Proteção de Dados</a>.</p>
          </section>

          <section id="contato" className="scroll-mt-6" aria-labelledby="contato-titulo">
            <h2 id="contato-titulo" className={headingClass}>8. Contato e atualizações</h2>
            <p className={paragraphClass}>Responsável pelo projeto: <strong className="text-text-dark">Equipe do projeto acadêmico PoupEazy</strong>.</p>
            <a href={contactLink} className={`mt-4 inline-flex max-w-full items-center gap-2 ${linkClass}`}><Mail size={18} className="shrink-0" aria-hidden="true" /><span className="break-all">{contactEmail}</span></a>
            <p className={paragraphClass}>Podemos atualizar esta política para acompanhar mudanças no projeto e no tratamento de dados. A data no início da página identifica a versão vigente. Mudanças que exijam informação ou autorização específica serão apresentadas de forma adequada antes do novo tratamento.</p>
          </section>
        </article>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <span>PoupEazy · Projeto acadêmico</span>
          <Link to="/excluir-conta" className={linkClass}>Excluir conta e dados</Link>
        </footer>
      </main>
    </div>
  )
}
