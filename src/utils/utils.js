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


export { formatPrice, formatDateTime };
