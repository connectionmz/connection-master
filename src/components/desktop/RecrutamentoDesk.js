import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, equalTo, onValue, off, push, set, get, update, remove } from 'firebase/database';
import { Alert, Box, Snackbar, Typography, useMediaQuery } from '@mui/material';
import BuscarCandidatos from '../recrutamento/BuscarCandidatos';
import VagasPublicadas from '../recrutamento/VagasPublicadas';
import CandidatoDialog from '../recrutamento/CandidatoDialog';
import PublicarVaga from '../recrutamento/PublicarVaga';

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
  const [vagas, setVagas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaBusca, setAreaBusca] = useState('');
  const [loading, setLoading] = useState({ vagas: false, candidatos: false });
  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [areasFormacao, setAreasFormacao] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [areas, setAreas] = useState({}); 
  const [perfis, setPerfis] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');

  const showNotification = useCallback((message, severity) => {
    setNotification({ open: true, message, severity });
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load áreas de atuação
        const areasAtuacaoRef = ref(externalDb, 'areasDeActuacao');
        const areasAtuacaoListener = onValue(areasAtuacaoRef, (snapshot) => {
          setAreas(snapshot.val() || {});
        });

        // Load áreas de formação
        const areasForRef = ref(externalDb, 'areasDeFormacao');
        const areasForListener = onValue(areasForRef, (snapshot) => {
          const data = snapshot.val();
          const formacaoArray = data ? Object.values(data).map(item => ({
            nivel: item.nivel,
            descricao: item.descricao
          })) : [];
          setAreasFormacao(formacaoArray);
        });

        // Load company vacancies
        setLoading(prev => ({ ...prev, vagas: true }));
        const vagasRef = query(ref(externalDb, 'vagas'), orderByChild('empresaId'), equalTo(user.id));
        const vagasListener = onValue(vagasRef, (snapshot) => {
          const data = snapshot.val();
          const vagasArray = data ? Object.entries(data).map(([id, vaga]) => ({ id, ...vaga })) : [];
          setVagas(vagasArray);
          setLoading(prev => ({ ...prev, vagas: false }));
        });

        return () => {
          off(areasAtuacaoRef, areasAtuacaoListener);
          off(areasForRef, areasForListener);
          off(vagasRef, vagasListener);
        };
      } catch (error) {
        showNotification('Erro ao carregar dados', 'error');
      }
    };
    
    loadInitialData();
  }, [user.id, showNotification]);

  // Load candidate profiles
  useEffect(() => {
    const perfisRef = ref(externalDb, "candidato");
    const perfisListener = onValue(perfisRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const perfisArray = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((perfil) => perfil.profileCompleted);
        setPerfis(perfisArray);
      }
    });
    return () => off(perfisRef, perfisListener);
  }, []);

  const buscarCandidatos = useCallback(async () => {
    if (!areaBusca) return;

    try {
      setLoading(prev => ({ ...prev, candidatos: true }));

      const candidatosRef = ref(externalDb, 'candidato');
      
      const [atuacaoSnapshot, formacaoSnapshot] = await Promise.all([
        get(query(candidatosRef, orderByChild('areasDeActuacao'), equalTo(areaBusca))),
        get(query(candidatosRef, orderByChild('areasDeFormacao'), equalTo(areaBusca)))
      ]);

      const candidatosUnicos = new Map();
      
      if (atuacaoSnapshot.exists()) {
        Object.entries(atuacaoSnapshot.val()).forEach(([id, cand]) => {
          candidatosUnicos.set(id, { ...cand, matchType: 'Atuação' });
        });
      }
      
      if (formacaoSnapshot.exists()) {
        Object.entries(formacaoSnapshot.val()).forEach(([id, cand]) => {
          if (!candidatosUnicos.has(id)) {
            candidatosUnicos.set(id, { ...cand, matchType: 'Formação' });
          }
        });
      }

      setCandidatos(Array.from(candidatosUnicos.values()));
      setLoading(prev => ({ ...prev, candidatos: false }));
    } catch (error) {
      showNotification('Erro ao buscar candidatos', 'error');
      setLoading(prev => ({ ...prev, candidatos: false }));
    }
  }, [areaBusca, showNotification]);


  const verificarCompatibilidade = useCallback(async (vagas) => {
    const candidatosRef = ref(externalDb, "candidato");
    const snapshot = await get(candidatosRef);
  
    if (snapshot.exists()) {
      const candidatos = snapshot.val();
      const candidatosComAreas = Object.keys(candidatos).filter((userId) => {
        const candidato = candidatos[userId];
        return candidato.areasDeActuacao && candidato.areasDeActuacao.length > 0;
      });
  
      vagas.forEach((vaga) => {
        if (new Date(vaga.dataLimite) < new Date()) return;
  
        candidatosComAreas.forEach(async (userId) => {
          const candidato = candidatos[userId];
          const smsRef = ref(externalDb, `vagasSMS/${userId}/${vaga.id}`);
          const smsSnapshot = await get(smsRef);
  
          if (smsSnapshot.exists()) return;
  
          const areasVaga = Array.isArray(vaga.areasDeFormacao)
            ? vaga.areasDeFormacao.map((area) => area.toLowerCase())
            : [vaga.areasDeFormacao?.toLowerCase()];
  
          const areasCandidato = Array.isArray(candidato.areasDeActuacao)
            ? candidato.areasDeActuacao.map((area) => area.toLowerCase())
            : [];
  
          const areasIntersecao = areasVaga.filter((area) =>
            areasCandidato.includes(area)
          );
  
          if (areasIntersecao.length > 0) {
            enviarMensagemCandidato(userId, vaga, candidato);
          }
        });
      });
    }
  }, [showNotification]);
  

  const enviarMensagemCandidato = (userId, vaga, candidato) => {
    const mensagem = {
      titulo: vaga.titulo,
      descricao: vaga.descricao,
      localizacao: vaga.localizacao,
      timestamp: new Date().toISOString(),
    };

    const telefone = candidato.telefone || candidato.telefoneAlternativo;
    const smsRef = ref(externalDb, `vagasSMS/${userId}/${vaga.id}`);
    
    set(smsRef, {
      idVaga: vaga.id,
      numeroCelular: telefone || "Número não disponível",
      estadoEnvio: "pendente",
      dataEnvio: null,
      link: vaga.link,
    }).then(async () => {
      if (!telefone) {
        await update(smsRef, { estadoEnvio: "falha", dataEnvio: new Date().toISOString() });
        return;
      }

      try {
        await update(smsRef, { estadoEnvio: "Por enviar", dataEnvio: new Date().toISOString() });
      } catch (error) {
        await update(smsRef, { estadoEnvio: "falha", dataEnvio: new Date().toISOString() });
      }
    });
  };

  const publicarVaga = useCallback(async (vagaData) => {
    try {
      setLoading(prev => ({ ...prev, vagas: true }));
      
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
      
      // Get the newly created vaga to check compatibility
      const snapshot = await get(novaVagaRef);
      if (snapshot.exists()) {
        const newVaga = { id: novaVagaRef.key, ...snapshot.val() };
        verificarCompatibilidade([newVaga]);
      }
    } catch (error) {
      console.error('Erro ao publicar vaga:', error);
      showNotification('Erro ao publicar vaga', 'error');
    } finally {
      setLoading(prev => ({ ...prev, vagas: false }));
    }
  }, [user, showNotification, verificarCompatibilidade]);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);



  

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recrutamento Avançado
      </Typography>

      <PublicarVaga 
        user={user} 
        areasFormacao={areasFormacao} 
        areasAtuacao={areas} 
        loading={loading.vagas} 
        onPublicarVaga={publicarVaga} 
      />

      <BuscarCandidatos 
        areaBusca={areaBusca}
        candidatos={candidatos}
        loading={loading.candidatos}
        onBuscarCandidatos={buscarCandidatos}
        onSelectCandidato={setSelectedCandidato}
        onAreaBuscaChange={setAreaBusca}
      />

<VagasPublicadas 
  vagas={vagas} 
  loading={loading.vagas} 
  searchTerm={searchTerm} 
  setSearchTerm={setSearchTerm}
  onDeleteVaga={async (vagaId) => {
    try {
      setLoading(prev => ({ ...prev, vagas: true }));
      await remove(ref(externalDb, `vagas/${vagaId}`));
      showNotification('Vaga excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
      showNotification('Erro ao excluir vaga', 'error');
    } finally {
      setLoading(prev => ({ ...prev, vagas: false }));
    }
  }}
/>

      <CandidatoDialog 
        candidato={selectedCandidato}
        open={!!selectedCandidato}
        onClose={() => setSelectedCandidato(null)}
        onContactar={(candidato) => {
          console.log('Contatando:', candidato.email);
          setSelectedCandidato(null);
        }}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecrutamentoDesk;