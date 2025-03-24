import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';

export const SectorDeActividades = ({ companyData, handleChange }) => {
  const [sectores, setSectores] = useState([]);

  useEffect(() => {
    const sectoresRef = ref(db, 'sectores_de_atividade');
    onValue(sectoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sectoresList = Object.values(data).map(item => item.setor);
        setSectores(sectoresList);
      } else {
        setSectores([]);
      }
    });
  }, []);

  return (
    <Box mt={2}>
      <FormControl fullWidth>
        <InputLabel id="sector-label">Sector de Actividade</InputLabel>
        <Select
          labelId="sector-label"
          id="sector"
          name="sector"
          value={companyData.sector || ''}
          onChange={handleChange}
          required
          label="Sector de Actividade"
        >
          {sectores.length > 0 ? (
            sectores.map((sector, index) => (
              <MenuItem key={index} value={sector}>
                {sector}
              </MenuItem>
            ))
          ) : (
            <MenuItem value="" disabled>
              Carregando sectores...
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export const TipoEntidade = ({ companyData, handleChange }) => {
  const [tipoEntidade, setTipoEntidade] = useState([]);

  useEffect(() => {
    const tipoEntidadeRef = ref(db, 'tipos_entidades');
    onValue(tipoEntidadeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tipoEntidadeList = Object.values(data).map(item => item.setor);
        setTipoEntidade(tipoEntidadeList);
      } else {
        setTipoEntidade([]);
      }
    });
  }, []);

  return (
    <Box mt={2}>
      <FormControl fullWidth>
        <InputLabel id="tipo-entidade-label">Tipo de Entidade</InputLabel>
        <Select
          labelId="tipo-entidade-label"
          id="tipo-entidade"
          name="tipo-entidade"
          value={companyData.sector || ''}
          onChange={handleChange}
          required
          label="Tipo de Entidade"
        >
          {tipoEntidade.length > 0 ? (
            tipoEntidade.map((entidade, index) => (
              <MenuItem key={index} value={entidade}>
                {entidade}
              </MenuItem>
            ))
          ) : (
            <MenuItem value="" disabled>
              Carregando tipos de entidade...
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export const Provincias = ({ companyData, handleChange }) => {
  const provinciasList = [
    'Maputo',
    'Gaza',
    'Inhambane',
    'Sofala',
    'Manica',
    'Tete',
    'Zambézia',
    'Nampula',
    'Cabo Delgado',
    'Niassa',
  ];

  return (
    <Box mt={2}>
      <FormControl fullWidth>
        <InputLabel id="provincia-label">Província</InputLabel>
        <Select
          labelId="provincia-label"
          id="provincia"
          name="provincia"
          value={companyData.provincia || ''}
          onChange={handleChange}
          required
          label="Província"
        >
          <MenuItem value="" disabled>
            Escolha...
          </MenuItem>
          {provinciasList.map((provincia, index) => (
            <MenuItem key={index} value={provincia}>
              {provincia}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export const EditorText = ({ description, setDescription }) => {
  return (
    <Box mt={2}>
      <ReactQuill
        value={description || ''}
        onChange={setDescription}
        theme="snow"
        placeholder="Descreva"
        modules={{
          toolbar: [
            [{ header: '1' }, { header: '2' }, { font: [] }],
            [{ size: [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['clean'],
          ],
        }}
      />
    </Box>
  );
};