import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, equalTo, onValue, off, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Snackbar, Typography, useMediaQuery } from '@mui/material';
import BuscarCandidatos from '../recrutamento/BuscarCandidatos';
import VagasPublicadas from '../recrutamento/VagasPublicadas';
import CandidatoDialog from '../recrutamento/CandidatoDialog';
import PublicarVaga from '../recrutamento/PublicarVaga';

// Configuração do Firebase (mesma do código original)
const externalFirebaseConfig = {
  apiKey: "AIzaSyC1oa1a3ts2jP4LXDA0lYzvkfKXO4L5ijk",
  authDomain: "connectiopos.firebaseapp.com",
  databaseURL: "https://connectiopos-default-rtdb.firebaseio.com",
  projectId: "connectiopos",
  storageBucket: "connectiopos.appspot.com",
  messagingSenderId: "1083339114910",
  appId: "1:1083339114910:web:5ab0c8b4cf4ff729db6e8f",
  measurementId: "G-D7305D656Y"
};

const externalApp = initializeApp(externalFirebaseConfig, 'external');
const externalDb = getDatabase(externalApp);

const RecrutamentoDesk = ({ user }) => {
  const [state, setState] = useState({
    vagas: [],
    candidatos: [],
    searchTerm: '',
    areaBusca: '',
    loading: { vagas: false, candidatos: false },
    selectedCandidato: null,
    areasFormacao: [],
    notification: { open: false, message: '', severity: 'success' }
  });
  const [areas, setAreas] = useState({}); 
  const isMobile = useMediaQuery('(max-width:600px)');

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carregar áreas de atuação
        const areasAtuacaoRef = ref(externalDb, 'areasDeActuacao');
        onValue(areasAtuacaoRef, (snapshot) => {
          const areasData = snapshot.val();
          setAreas(areasData); // Define as áreas com suas subcategorias
        });

        // Carregar áreas de formação
        const areasForRef = ref(externalDb, 'areasDeFormacao');
        onValue(areasForRef, (snapshot) => {
          const data = snapshot.val();
          const formacaoArray = data ? Object.values(data).map(item => ({
            nivel: item.nivel,
            descricao: item.descricao
          })) : [];
          setState(prev => ({ ...prev, areasFormacao: formacaoArray }));
        });

        // Carregar vagas da empresa
        setState(prev => ({ ...prev, loading: { ...prev.loading, vagas: true } }));
        const vagasRef = query(ref(externalDb, 'vagas'), orderByChild('empresaId'), equalTo(user.id));
        onValue(vagasRef, (snapshot) => {
          const data = snapshot.val();
          const vagasArray = data ? Object.entries(data).map(([id, vaga]) => ({ id, ...vaga })) : [];
          setState(prev => ({ 
            ...prev, 
            vagas: vagasArray,
            loading: { ...prev.loading, vagas: false }
          }));
        });

      } catch (error) {
        showNotification('Erro ao carregar dados', 'error');
      }
    };

    loadInitialData();
  }, [user.id]);

  const buscarCandidatos = async () => {
    if (!state.areaBusca) return;

    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, candidatos: true } }));
      
      const candidatosRef = ref(externalDb, 'candidatos');
      const [atuacaoData, formacaoData] = await Promise.all([
        new Promise(resolve => onValue(
          query(candidatosRef, orderByChild('areasDeActuacao'), equalTo(state.areaBusca)), 
          snapshot => resolve(snapshot.val())
        )),
        new Promise(resolve => onValue(
          query(candidatosRef, orderByChild('areasDeFormacao'), equalTo(state.areaBusca)), 
          snapshot => resolve(snapshot.val())
        ))
      ]);

      const candidatosUnicos = new Map();
      
      if (atuacaoData) {
        Object.entries(atuacaoData).forEach(([id, cand]) => {
          candidatosUnicos.set(id, { ...cand, matchType: 'Atuação' });
        });
      }
      
      if (formacaoData) {
        Object.entries(formacaoData).forEach(([id, cand]) => {
          if (!candidatosUnicos.has(id)) {
            candidatosUnicos.set(id, { ...cand, matchType: 'Formação' });
          }
        });
      }
      
      setState(prev => ({ 
        ...prev, 
        candidatos: Array.from(candidatosUnicos.values()),
        loading: { ...prev.loading, candidatos: false }
      }));

    } catch (error) {
      showNotification('Erro ao buscar candidatos', 'error');
    }
  };

  const publicarVaga = async (vagaData) => {

    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, vagas: true } }));
      
      const novaVagaRef = push(ref(externalDb, 'vagas'));
      await set(novaVagaRef, {
        ...vagaData,
        empresa: user.nome,
        empresaId: user.id,
        logoEmpresa: user.logoUrl,
        dataPublicacao: new Date().toISOString(),
        status: 'Ativa',
        candidatos: []
      });

      showNotification('Vaga publicada com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao publicar vaga:', error);
      showNotification('Erro ao publicar vaga', 'error');
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, vagas: false } }));
    }
  };

  const showNotification = (message, severity) => {
    setState(prev => ({ 
      ...prev, 
      notification: { open: true, message, severity }
    }));
  };

  const handleCloseNotification = () => {
    setState(prev => ({ ...prev, notification: { ...prev.notification, open: false } }));
  };

  const handleStateChange = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recrutamento Avançado
      </Typography>

      <PublicarVaga 
        user={user} 
        areasFormacao={state.areasFormacao} 
        areasAtuacao={areas} 
        provincia={state.provincia} 
        loading={state.loading.vagas} 
        onPublicarVaga={publicarVaga} 
      />

      <BuscarCandidatos 
        areaBusca={state.areaBusca}
        candidatos={state.candidatos}
        loading={state.loading.candidatos}
        onBuscarCandidatos={buscarCandidatos}
        onSelectCandidato={(candidato) => handleStateChange('selectedCandidato', candidato)}
        onAreaBuscaChange={(area) => handleStateChange('areaBusca', area)}
      />

      <VagasPublicadas 
        vagas={state.vagas} 
        loading={state.loading.vagas} 
        searchTerm={state.searchTerm} 
        onSearchChange={(term) => handleStateChange('searchTerm', term)}
      />

      <CandidatoDialog 
        candidato={state.selectedCandidato}
        open={!!state.selectedCandidato}
        onClose={() => handleStateChange('selectedCandidato', null)}
        onContactar={(candidato) => {
          console.log('Contatando:', candidato.email);
          handleStateChange('selectedCandidato', null);
        }}
      />

      <Snackbar
        open={state.notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={state.notification.severity}
          sx={{ width: '100%' }}
        >
          {state.notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecrutamentoDesk;