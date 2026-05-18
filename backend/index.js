require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PluggyClient } = require('pluggy-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Inicia a ligação com a Pluggy de forma segura
const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// Rota 1: O Frontend pede permissão para abrir o Widget na tela
app.get('/api/pluggy/token', async (req, res) => {
  try {
    const data = await pluggyClient.createConnectToken();
    res.json({ connectToken: data.accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar token da Pluggy' });
  }
});

// Rota 2: O Frontend envia o ID do Banco Conectado e nós puxamos o extrato
app.get('/api/pluggy/transactions/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const accounts = await pluggyClient.fetchAccounts(itemId);
    if (accounts.results.length === 0) return res.json({ transactions: [] });
    
    const accountId = accounts.results[0].id;
    const transactions = await pluggyClient.fetchTransactions(accountId);
    
    const transacoesLimpas = transactions.results.map(tx => ({
      descricao: tx.description,
      valor: Math.abs(tx.amount),
      tipo: tx.amount < 0 ? 'despesa' : 'receita',
      data: new Date(tx.date).toISOString().split('T')[0]
    }));

    res.json({ transactions: transacoesLimpas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar extrato' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend Open Finance a correr na porta ${process.env.PORT}`);
});