import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Button,
  Grid,
  IconButton
} from '@mui/material';
import { Email, Phone, Close, Star } from '@mui/icons-material';

const CandidatoDialog = ({ candidato, open, onClose, onContactar }) => {
  if (!candidato) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Perfil Completo</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar 
                src={candidato.fotoPerfil} 
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              
              <Typography variant="h6" align="center">
                {candidato.nome}
              </Typography>
              
              <Typography color="textSecondary" align="center" sx={{ mb: 2 }}>
                {candidato.profissao || 'Profissional'}
              </Typography>
              
              <Box width="100%" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  CONTATO
                </Typography>
                
                <Box sx={{ pl: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    {candidato.email}
                  </Typography>
                  
                  {candidato.telefone && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      {candidato.telefone}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box width="100%">
                <Typography variant="subtitle2" gutterBottom>
                  ÁREAS DE ATUAÇÃO
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {candidato.areasDeActuacao?.map((area, i) => (
                    <Chip key={`atuacao-${i}`} label={area} size="small" />
                  )) || <Typography variant="body2">Não informado</Typography>}
                </Box>
              </Box>
              
              <Box width="100%" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ÁREAS DE FORMAÇÃO
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {candidato.areasDeFormacao?.map((area, i) => (
                    <Chip key={`formacao-${i}`} label={area} size="small" color="info" />
                  )) || <Typography variant="body2">Não informado</Typography>}
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Star color="primary" sx={{ mr: 1 }} />
                Avaliação: {candidato.rating || 'Não avaliado'}
              </Typography>
              
              <Typography variant="body1">
                {candidato.resumo || 'Nenhum resumo profissional disponível.'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Experiência Profissional
            </Typography>
            
            {candidato.experiencia?.length > 0 ? (
              candidato.experiencia.map((exp, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography fontWeight="bold">{exp.cargo}</Typography>
                  <Typography variant="body2">{exp.empresa}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {exp.periodo} • {exp.duracao}
                  </Typography>
                  {exp.descricao && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {exp.descricao}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body2">Nenhuma experiência registrada</Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Formação Acadêmica
            </Typography>
            
            {candidato.formacao?.length > 0 ? (
              candidato.formacao.map((form, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography fontWeight="bold">{form.curso}</Typography>
                  <Typography variant="body2">{form.instituicao}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {form.periodo} • {form.status || 'Concluído'}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2">Nenhuma formação registrada</Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<Email />}
          onClick={() => onContactar(candidato)}
          sx={{ borderRadius: 2 }}
        >
          Enviar Proposta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidatoDialog;