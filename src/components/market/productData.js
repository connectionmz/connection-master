const POSITIVE_FIELDS = ['weight', 'height', 'width', 'length'];

export const parseProductNumber = (value) => {
  if (typeof value === 'string') {
    return Number.parseFloat(value.replace(',', '.'));
  }
  return Number.parseFloat(value);
};

export const validateProduct = (product = {}) => {
  const errors = {};

  if (!product.name?.trim()) {
    errors.name = 'Nome é obrigatório';
  }

  if (!(parseProductNumber(product.price) > 0)) {
    errors.price = 'Preço deve ser um número maior que zero';
  }

  if (product.type === 'product') {
    if (!(parseProductNumber(product.qtd) > 0)) {
      errors.qtd = 'Quantidade deve ser um número maior que zero';
    }

    if (product.nationalShipping) {
      POSITIVE_FIELDS.forEach((field) => {
        if (!(parseProductNumber(product[field]) > 0)) {
          const labels = { weight: 'Peso', height: 'Altura', width: 'Largura', length: 'Comprimento' };
          errors[field] = `${labels[field]} deve ser um número maior que zero`;
        }
      });
    }
  }

  return errors;
};

export const normalizeProduct = (product = {}, { imageUrl = '', includeCreatedAt = false } = {}) => {
  const isPhysicalProduct = product.type === 'product';
  const hasNationalShipping = isPhysicalProduct && Boolean(product.nationalShipping);
  const now = Date.now();

  return {
    type: product.type || 'product',
    name: product.name?.trim() || '',
    price: parseProductNumber(product.price),
    description: product.description?.trim() || '',
    imageUrl,
    category: product.category?.trim() || 'Geral',
    sku: product.sku?.trim() || '',
    qtd: isPhysicalProduct ? parseProductNumber(product.qtd) : null,
    weight: hasNationalShipping ? parseProductNumber(product.weight) : null,
    height: hasNationalShipping ? parseProductNumber(product.height) : null,
    width: hasNationalShipping ? parseProductNumber(product.width) : null,
    length: hasNationalShipping ? parseProductNumber(product.length) : null,
    nationalShipping: hasNationalShipping,
    ...(includeCreatedAt ? { createdAt: now } : {}),
    updatedAt: now,
  };
};
