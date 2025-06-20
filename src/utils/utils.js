const formatPrice = (value) => {
  if (!value) return '0,00';

  const cleanedValue = String(value).replace(',', '.');
  const number = Number(cleanedValue);

  if (isNaN(number)) return '0,00';

  return number.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

 const formatDateTime = (isoDate) => {
  const date = new Date(isoDate);
  const formattedDate = date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
  });

  const formattedTime = date.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${formattedDate} às ${formattedTime}`;
};

const formatarMoeda = (valor) => {
 if (valor === "" || valor === null || isNaN(valor)) return "";

  const partes = Number(valor).toFixed(2).split(".");
  const inteiros = partes[0];
  const decimais = partes[1];

  const comPonto = inteiros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${comPonto},${decimais}`;
};

 const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const formatCurrency = (value) => {
  // Remove tudo que não for número
  let numericValue = value.replace(/\D/g, "");
  
  // Adiciona vírgula para separar os centavos
  numericValue = numericValue.slice(0, -2) + "," + numericValue.slice(-2);
  
  // Adiciona ponto para separar milhar
  numericValue = numericValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

  return numericValue;
};

function formatarValor(valor) {
  if (typeof valor === 'string') {
    valor = valor.replace(/\s/g, '').replace(',', '.'); // remove espaços e troca vírgula por ponto
  }

  const numero = Number(valor);

  if (isNaN(numero)) {
    return 'Valor inválido';
  }

  return numero.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function getErrorMessage(errorCode) {
  const errorMessages = {
    "INS-0": "Pedido processado com sucesso.",
    "INS-1": "Erro interno.",
    "INS-2": "Chave de API inválida.",
    "INS-4": "Utilizador não está ativo.",
    "INS-5": "Transação cancelada pelo cliente.",
    "INS-6": "Transação falhou.",
    "INS-9": "Tempo limite do pedido excedido.",
    "INS-10": "Transação duplicada.",
    "INS-13": "Shortcode inválido utilizado.",
    "INS-14": "Referência inválida utilizada.",
    "INS-15": "Valor inválido utilizado.",
    "INS-16": "Não foi possível processar o pedido devido a sobrecarga temporária.",
    "INS-17": "Referência de transação inválida. O comprimento deve estar entre 1 e 20.",
    "INS-18": "TransactionID inválido utilizado.",
    "INS-19": "ThirdPartyReference inválido utilizado.",
    "INS-20": "Parâmetros incompletos. Por favor, tente novamente.",
    "INS-21": "Falha na validação dos parâmetros. Por favor, tente novamente.",
    "INS-22": "Tipo de operação inválido.",
    "INS-23": "Estado desconhecido. Contacte o suporte M-Pesa.",
    "INS-24": "InitiatorIdentifier inválido utilizado.",
    "INS-25": "SecurityCredential inválido utilizado.",
    "INS-26": "Não autorizado.",
    "INS-993": "Débito direto em falta.",
    "INS-994": "Débito direto já existe.",
    "INS-995": "O perfil do cliente tem problemas.",
    "INS-996": "A conta do cliente não está ativa.",
    "INS-997": "Transação de vinculação não encontrada.",
    "INS-998": "Mercado inválido.",
    "INS-2001": "Erro de autenticação do iniciador.",
    "INS-2002": "Recetor inválido.",
    "INS-2006": "Saldo insuficiente.",
    "INS-2051": "MSISDN inválido.",
    "INS-2057": "Código de idioma inválido.",
  };
  return errorMessages[errorCode] || "Código de erro desconhecido.";
}

export { formatPrice, formatDateTime,formatarMoeda, shuffleArray, formatCurrency, formatarValor, getErrorMessage };
