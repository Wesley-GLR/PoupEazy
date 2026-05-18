import { useState, useEffect } from "react";
import { PluggyConnect } from "react-pluggy-connect";
import { useTransactions } from "../hooks/useTransactions";
import { useBudget } from "../hooks/useBudget";
import { useCategories } from "../hooks/useCategories";
import {
  Landmark,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Integrations() {
  const { addTransaction } = useTransactions();
  const { budgets } = useBudget();
  const { categories } = useCategories();

  const [connectToken, setConnectToken] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [abrirPluggy, setAbrirPluggy] = useState(false);

  // Estados para o Pop-up de Confirmação de Exclusão
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [bancoParaExcluir, setBancoParaExcluir] = useState<string | null>(null);

  // Lê a lista de bancos salvos no navegador
  const [bancosConectados, setBancosConectados] = useState<string[]>(() => {
    const salvos = localStorage.getItem("poupeazy_bancos_conectados");
    return salvos ? JSON.parse(salvos) : [];
  });

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

  // Motor de categorização inteligente
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

  // Quando o usuário termina de colocar a senha no Widget oficial da Pluggy
  const handleSuccess = async (itemData: any) => {
    setIsSyncing(true);
    const instituicao = itemData.item.connector.name;

    setBancosConectados((prev) => {
      const novaLista = [...prev, instituicao];
      localStorage.setItem(
        "poupeazy_bancos_conectados",
        JSON.stringify(novaLista),
      );
      return novaLista;
    });

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
        `http://localhost:3001/api/pluggy/transactions/${itemData.item.id}`,
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

  // Abre o Pop-up e guarda qual banco o usuário quer apagar
  const abrirConfirmacaoExcluir = (banco: string) => {
    setBancoParaExcluir(banco);
    setMostrarModalExcluir(true);
  };

  // Executa a exclusão real após a confirmação no Pop-up
  const confirmarExclusao = () => {
    if (bancoParaExcluir) {
      const novaLista = bancosConectados.filter(
        (banco) => banco !== bancoParaExcluir,
      );
      setBancosConectados(novaLista);
      localStorage.setItem(
        "poupeazy_bancos_conectados",
        JSON.stringify(novaLista),
      );
      toast.success(`Conexão com o ${bancoParaExcluir} removida.`);
    }
    // Fecha o modal e limpa o estado
    setMostrarModalExcluir(false);
    setBancoParaExcluir(null);
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

        {/* 1. LISTA DE BANCOS CONECTADOS */}
        {bancosConectados.length > 0 ? (
          <div className="space-y-3 mb-6">
            {bancosConectados.map((banco, index) => (
              <div
                key={index}
                className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-success flex items-center gap-2">
                    <CheckCircle size={16} /> Ligado ao {banco}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Dados sincronizados e atualizados.
                  </p>
                </div>

                {/* Clicar aqui agora abre o nosso Modal/Pop-up */}
                <button
                  onClick={() => abrirConfirmacaoExcluir(banco)}
                  className="p-2 text-muted hover:text-error rounded-md transition hover:bg-error/10"
                  title={`Desconectar ${banco}`}
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
            {bancosConectados.length > 0
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
                    {bancoParaExcluir}
                  </span>{" "}
                  com o PoupEazy.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarModalExcluir(false);
                  setBancoParaExcluir(null);
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
