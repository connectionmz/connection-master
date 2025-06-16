import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { MedicalServices, AppRegistration, BusinessCenterRounded, School, Receipt, PeopleAltTwoTone, Gavel, Business } from '@mui/icons-material';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Link } from 'react-router-dom'; // Importe o Link para navegação
import { db } from '../../fb';

// Função para obter o ícone da categoria
const getCategoryIcon = (categoryName) => {
  const icons = {
    "Serviços de Emergência": <MedicalServices />,
    "Registo de Entidade": <AppRegistration />,
    "Financiamentos para MPME's": <BusinessCenterRounded />,
    "Formação de MPME's": <School />,
    "Impostos e Licenças": <Receipt />,
    "Segurança Social": <PeopleAltTwoTone />,
    "Saúde Pública": <MedicalServices />,
    "Entidades Reguladoras": <Gavel />,
  };
  return icons[categoryName] || <Business />; // Ícone padrão caso não esteja na lista
};

const CategoriaList = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    // Referência para a Realtime Database
    const categoriasRef = ref(db, 'categoriasExternas');

    // Busca os dados da categoria
    onValue(categoriasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte o objeto de categorias em um array
        const categoriasArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCategorias(categoriasArray);
      }
    });
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        overflowX: 'auto', // Permite scroll horizontal
        gap: 2, // Espaçamento entre os itens
        padding: 2,
        '&::-webkit-scrollbar': {
          height: '8px', // Altura da barra de scroll
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#0073b1', // Azul do LinkedIn para o indicador de scroll
          borderRadius: '4px', // Borda arredondada
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#e1e9ee', // Cor de fundo da barra de scroll
        },
      }}
    >
      {categorias.map((categoria) => (
        <Link
          key={categoria.id}
          to={`/categoria/${categoria.name}`} // Passa o id como parâmetro na URL
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center', // Alinha ícone e texto verticalmente
              minWidth: '200px', // Largura mínima para cada item
              padding: 2,
              backgroundColor:'#FFF',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Sombra sutil
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f0f0f0', // Efeito hover
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)', // Sombra mais pronunciada no hover
              },
            }}
          >
            <IconButton sx={{ color: '#0073b1', marginRight: 1 }}> {/* Azul do LinkedIn */}
              {getCategoryIcon(categoria.name)}
            </IconButton>
            <Typography variant="body2" align="center" sx={{ fontWeight: 500, color: '#000000' }}>
              {categoria.name}
            </Typography>
          </Box>
        </Link>
      ))}
    </Box>
  );
};

export default CategoriaList;