import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { MedicalServices, AppRegistration, BusinessCenterRounded, School, Receipt, PeopleAltTwoTone, Gavel, Business } from '@mui/icons-material';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Link } from 'react-router-dom'; // Importe o Link para navegação
import { db } from '../../fb';

// Função para obter o ícone da categoria
const getCategoryIcon = (categoryName) => {
  const icons = {
    "Emergência": <MedicalServices />,
    "Registo": <AppRegistration />,
    "Financiamentos PMEs": <BusinessCenterRounded />,
    "Formações": <School />,
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
        backgroundColor: '#f5f5f5',
        '&::-webkit-scrollbar': {
          height: '8px', // Altura da barra de scroll
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#888', // Cor do indicador de scroll
          borderRadius: '4px', // Borda arredondada
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1', // Cor de fundo da barra de scroll
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
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 1,
              '&:hover': {
                backgroundColor: '#f0f0f0', // Efeito hover
              },
            }}
          >
            <IconButton sx={{ color: 'primary.main', marginRight: 1 }}>
              {getCategoryIcon(categoria.name)}
            </IconButton>
            <Typography variant="body2" align="center">
              {categoria.name}
            </Typography>
          </Box>
        </Link>
      ))}
    </Box>
  );
};

export default CategoriaList;