const formatPrice = (value) => {
  if (!value) return '0,00';

  // Substitui vírgulas por pontos para conversão correta
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

export { formatPrice, formatDateTime,formatarMoeda  };
