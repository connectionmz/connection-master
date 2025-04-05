// Adicione esta função no início do arquivo, antes do componente
const formatPrice = (value) => {
    if (!value) return '0.00';
    
    // Converte para número e formata com 2 casas decimais
    const number = Number(value);
    if (isNaN(number)) return '0.00';
    
    return number.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  export {formatPrice}