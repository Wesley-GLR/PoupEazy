import { useState, useEffect } from "react";
import { PluggyConnect } from "react-pluggy-connect";
import { useTransactions } from "../hooks/useTransactions";
import { useBudget } from "../hooks/useBudget";
import { useCategories } from "../hooks/useCategories";
import { useIntegrations } from "../hooks/useIntegrations";
import type { OpenFinanceToken } from "../hooks/useIntegrations";
import {
  Landmark,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Componente principal da tela de Integrações (Open Finance).
 * * Responsável por gerenciar o vínculo entre o PoupEazy e as contas bancárias
 * do usuário através da API da Pluggy. Permite conectar novas instituições,
 * listar os bancos já sincronizados, realizar a importação automática do extrato
 * e desconectar vínculos existentes através de um modal de segurança.
 * * @returns A interface de gerenciamento de integrações bancárias.
 */
export default function Integrations() {
  const { addTransaction } = useTransactions();
  const { budgets } = useBudget();
  const { categories } = useCategories();
  const { tokens, loading: loadingTokens, connectBank, disconnectBank } = useIntegrations();

  const [connectToken, setConnectToken] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [abrirPluggy, setAbrirPluggy] = useState(false);

  // Estados para o Pop-up de Confirmação de Exclusão
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [tokenParaExcluir, setTokenParaExcluir] = useState<OpenFinanceToken | null>(null);

  // Assim que a tela carrega, pede permissão ao nosso backend Node.js
  useEffect(() => {
    async function getConnectToken() {
      try {
        const response = await fetch("http://localhost:3001/api/pluggy/token");
        const data = await response.json();
        if (data.connectToken) {
          setConnectToken(data.connectToken);
        } else {
          toast.error(
            "Erro ao gerar token. Verifique as chaves no .env do backend.",
          );
        }
      } catch (error) {
        toast.error(
          "Não conseguiu conectar com o Node.js. Ele está a rodar na porta 3001?",
        );
      }
    }
    getConnectToken();
  }, []);

  /**
   * Motor de categorização inteligente.
   * Analisa a descrição da transação importada e tenta mapeá-la para
   * uma das categorias pré-definidas do usuário com base em palavras-chave.
   * * @param descricao - O texto descritivo da transação vindo do extrato bancário.
   * @param tipo - O tipo da movimentação ('despesa' ou 'receita').
   * @returns O identificador único (ID) da categoria correspondente, ou a categoria padrão ('Outros') caso não encontre correspondência.
   */
  function descobrirCategoriaId(
    descricao: string,
    tipo: "despesa" | "receita",
  ) {
    const desc = descricao.toLowerCase();
    let nomeCategoria = "Outros";

    if (tipo === "despesa") {
      if (
        desc.includes("uber") ||
        desc.includes("99") ||
        desc.includes("posto")
      )
        nomeCategoria = "Transporte";
      if (
        desc.includes("ifood") ||
        desc.includes("mercado") ||
        desc.includes("padaria")
      )
        nomeCategoria = "Alimentação";
      if (
        desc.includes("netflix") ||
        desc.includes("spotify") ||
        desc.includes("amazon")
      )
        nomeCategoria = "Assinaturas";
      if (desc.includes("farmácia") || desc.includes("drogaria"))
        nomeCategoria = "Saúde";
      if (
        desc.includes("cruzeiro") ||
        desc.includes("ingresso") ||
        desc.includes("sócio")
      )
        nomeCategoria = "Lazer";
      if (
        desc.includes("whey") ||
        desc.includes("creatina") ||
        desc.includes("academia")
      )
        nomeCategoria = "Saúde";
      if (
        desc.includes("aws") ||
        desc.includes("kaggle") ||
        desc.includes("curso")
      )
        nomeCategoria = "Educação";
    } else {
      nomeCategoria = "Salário";
    }

    const catEncontrada = categories.find(
      (c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase(),
    );
    return catEncontrada ? catEncontrada.id : categories[0]?.id;
  }

  /**
   * Callback acionado com sucesso quando o usuário finaliza o fluxo de autenticação
   * no widget oficial da Pluggy. Extrai as informações da instituição, salva no banco
   * e dispara o processo de importação e categorização das transações.
   * * @param itemData - Objeto retornado pela Pluggy contendo o ID e detalhes do conector (instituição bancária).
   */
  const handleSuccess = async (itemData: any) => {
    setIsSyncing(true);
    const instituicao = itemData.item.connector.name;
    const itemId = itemData.item.id;

    // Salva a conexão bancária no Supabase (em vez de localStorage)
    const { error: connectError } = await connectBank(instituicao, itemId);
    if (connectError) {
      toast.error("Erro ao salvar a conexão bancária no banco de dados.");
      setIsSyncing(false);
      return;
    }

    toast.success(`Conta do ${instituicao} conectada! Puxando extrato...`);

    try {
      const now = new Date();
      const currentBudget = budgets.find(
        (b) => b.mes === now.getMonth() + 1 && b.ano === now.getFullYear(),
      );
      if (!currentBudget) {
        toast.error(
          "Crie um orçamento para este mês na tela de Orçamentos antes de importar.",
        );
        setIsSyncing(false);
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/pluggy/transactions/${itemId}`,
      );
      const { transactions } = await response.json();

      let sucessoCount = 0;

      for (const tx of transactions) {
        const idCategoria = descobrirCategoriaId(tx.descricao, tx.tipo);

        await addTransaction({
          id_orcamento: currentBudget.id,
          id_categoria: idCategoria,
          valor: tx.valor,
          data_transacao: tx.data,
          descricao: tx.descricao,
          tipo: tx.tipo,
          origem: "open_finance",
          status: "confirmada",
          nlp_metadata: { instituicao, origin: "pluggy_real" },
        });
        sucessoCount++;
      }

      toast.success(
        `${sucessoCount} transações do ${instituicao} importadas com sucesso!`,
      );
    } catch (error) {
      toast.error("Erro ao processar o extrato.");
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Prepara o estado interno e abre o modal de confirmação para exclusão
   * de um vínculo bancário específico.
   * * @param token - O objeto representando a conexão bancária (OpenFinanceToken) selecionada pelo usuário.
   */
  const abrirConfirmacaoExcluir = (token: OpenFinanceToken) => {
    setTokenParaExcluir(token);
    setMostrarModalExcluir(true);
  };

  /**
   * Executa a remoção definitiva do vínculo bancário selecionado no banco de dados
   * após a confirmação do usuário. Limpa o estado do modal ao finalizar.
   */
  const confirmarExclusao = async () => {
    if (tokenParaExcluir) {
      const { error } = await disconnectBank(tokenParaExcluir.id);
      if (error) {
        toast.error("Erro ao desconectar o banco. Tente novamente.");
      } else {
        toast.success(`Conexão com o ${tokenParaExcluir.instituicao} removida.`);
      }
    }
    // Fecha o modal e limpa o estado
    setMostrarModalExcluir(false);
    setTokenParaExcluir(null);
  };

  return (
    <div className="space-y-6 relative">
      <h1 className="text-3xl font-bold text-black">
        Integração Bancária (Open Finance)
      </h1>

      <div className="rounded-lg border border-border bg-surface-card p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Landmark size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Suas Contas Integradas</h2>
            <p className="text-sm text-muted mt-1">
              Gerencie suas conexões bancárias via Open Finance de forma segura.
            </p>
          </div>
        </div>

        {/* 1. LISTA DE BANCOS CONECTADOS (dados do Supabase) */}
        {loadingTokens ? (
          <div className="flex items-center justify-center gap-2 text-muted text-sm mb-6 bg-surface p-4 rounded-lg border border-dashed border-border">
            <Loader2 size={16} className="animate-spin" />
            Carregando conexões bancárias...
          </div>
        ) : tokens.length > 0 ? (
          <div className="space-y-3 mb-6">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-success flex items-center gap-2">
                    <CheckCircle size={16} /> Ligado ao {token.instituicao}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Conectado em{" "}
                    {new Date(token.criado_em).toLocaleDateString("pt-BR")}
                    {" · "}Dados sincronizados e atualizados.
                  </p>
                </div>

                {/* Clicar aqui agora abre o nosso Modal/Pop-up */}
                <button
                  onClick={() => abrirConfirmacaoExcluir(token)}
                  className="p-2 text-muted hover:text-error rounded-md transition hover:bg-error/10"
                  title={`Desconectar ${token.instituicao}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-6 bg-surface p-4 rounded-lg border border-dashed border-border text-center">
            Nenhum banco conectado ainda. Conecte sua primeira conta abaixo!
          </p>
        )}

        {/* 2. CONTROLE DO BOTÃO / POP-UP PLUGGY */}
        {!connectToken ? (
          <div className="animate-pulse bg-surface h-12 w-full rounded-lg flex items-center justify-center text-muted text-sm">
            Aguardando ligação com o servidor Node.js...
          </div>
        ) : !abrirPluggy ? (
          <button
            onClick={() => setAbrirPluggy(true)}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-light disabled:opacity-50 shadow-sm"
          >
            <Plus size={18} />
            {tokens.length > 0
              ? "Conectar outro banco / Nova conta"
              : "Conectar Conta Bancária"}
          </button>
        ) : (
          <div className="mt-4 flex justify-center bg-surface p-4 rounded-lg border border-border">
            <div className="text-center w-full">
              <p className="text-xs text-muted mb-3">
                Carregando janela de autenticação segura...
              </p>
              <PluggyConnect
                connectToken={connectToken}
                includeSandbox={true}
                onSuccess={(data) => {
                  setAbrirPluggy(false);
                  handleSuccess(data);
                }}
                onError={() => {
                  setAbrirPluggy(false);
                  toast.error("Conexão cancelada ou com erro.");
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. POP-UP / MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CONTA */}
      {mostrarModalExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border border-border shadow-2xl mx-4 transform scale-100 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-error/10 text-error rounded-full shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-black">
                  Excluir conexão bancária?
                </h3>
                <p className="text-sm text-muted">
                  Você deseja excluir essa conta? Esta ação removerá o vínculo
                  do{" "}
                  <span className="font-semibold text-black">
                    {tokenParaExcluir?.instituicao}
                  </span>{" "}
                  com o PoupEazy.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarModalExcluir(false);
                  setTokenParaExcluir(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-white text-muted hover:bg-surface transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
