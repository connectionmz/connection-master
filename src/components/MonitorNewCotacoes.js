import { ref, onChildAdded } from 'firebase/database';
import { db } from '../fb';

const MonitorNewCotacoes = () => {
  const cotacoesRef = ref(db, 'cotacoes'); // Refere-se à coleção de cotações no Firebase

  // Listener para novos pedidos de cotação
  onChildAdded(cotacoesRef, (snapshot) => {
    const newCotacao = snapshot.val();
    const { descricao, data, empresa, contactoEmpresa } = newCotacao;

    // Define a mensagem a ser enviada por SMS
    const message = `Novo pedido de cotação de ${empresa}: ${descricao}. Data: ${data}`;

    // Chama a função para enviar o SMS
    //sendSMS(contactoEmpresa, message);
  });
};

export default MonitorNewCotacoes;
