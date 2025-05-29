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



export { formatPrice, formatDateTime,formatarMoeda, shuffleArray, formatCurrency, formatarValor };
