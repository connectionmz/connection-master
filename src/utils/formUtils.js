import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';

const inputStyles = "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";

export const SectorDeActividades = ({ companyData, handleChange, inputStyles }) => {
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
    <div className="form-group mt-4">
      <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
        Sector de Actividade
      </label>
      <select
        id="sector"
        name="sector"
        value={companyData.sector}
        onChange={handleChange}
        required
        className={inputStyles}
      >
        {sectores.length > 0 ? (
          sectores.map((sector, index) => (
            <option key={index} value={sector}>
              {sector}
            </option>
          ))
        ) : (
          <option value="">Carregando sectores...</option>
        )}
      </select>
    </div>
  );
};

export const TipoEntidade = ({ companyData, handleChange, inputStyles }) => {
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
    <div className="form-group mt-4">
      <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
       Tipo de Entidades
      </label>
      <select
        id="sector"
        name="sector"
        value={companyData.sector}
        onChange={handleChange}
        required
        className={inputStyles}
      >
        {tipoEntidade.length > 0 ? (
          tipoEntidade.map((entidade, index) => (
            <option key={index} value={entidade}>
              {entidade}
            </option>
          ))
        ) : (
          <option value="">Carregando Tipo de entidade...</option>
        )}
      </select>
    </div>
  );
};

export const Provincias = ({ companyData, handleChange, inputStyles }) => { 
  return (
    <div className="form-group">
      <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">Província</label>
      <select
        id="provincia"
        name="provincia"
        value={companyData.provincia}
        onChange={handleChange}
        required
        className={inputStyles}>
        <option value="">Escolha...</option>
        <option value="Maputo">Maputo</option>
        <option value="Gaza">Gaza</option>
        <option value="Inhambane">Inhambane</option>
        <option value="Sofala">Sofala</option>
        <option value="Manica">Manica</option>
        <option value="Tete">Tete</option>
        <option value="Zambézia">Zambézia</option>
        <option value="Nampula">Nampula</option>
        <option value="Cabo Delgado">Cabo Delgado</option>
        <option value="Niassa">Niassa</option>
      </select>
    </div>
  );
};

export const EditorText = ({ description, setDescription }) => {
  return (
    <ReactQuill
      value={description || ''}
      onChange={setDescription}
      className="bg-white"
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
  );
};

