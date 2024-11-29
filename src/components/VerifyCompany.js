import React, { useState, useEffect } from 'react';
import { storage, db } from '../fb'; // Certifique-se de configurar o Firebase
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get, update } from 'firebase/database'; // Para Realtime Database
import { Snackbar, Alert, Button } from '@mui/material';

const VerifyCompany = ({ user }) => {
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isUnderReview, setIsUnderReview] = useState(true);

  // Verificar status de documentos
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const companyRef = dbRef(db, `company/${user.id}`);
        const snapshot = await get(companyRef);

        if (snapshot.exists() && snapshot.val().verificationDocs) {
          setIsUnderReview(true);
        }
      } catch (error) {
        console.error('Erro ao verificar status de documentos:', error);
      }
    };

    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  const handleFileChange = (e) => {
    setDocuments(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documents) {
      setSnackbarMessage('Por favor, selecione os documentos para enviar!');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);

    try {
      const uploadedDocs = [];

      for (let i = 0; i < documents.length; i++) {
        const file = documents[i];
        const fileRef = storageRef(storage, `company_documents/${user.uid}/${file.name}`);

        const uploadTask = uploadBytesResumable(fileRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => reject(error),
            () => resolve()
          );
        });

        const fileURL = await getDownloadURL(fileRef);
        uploadedDocs.push(fileURL);
      }

      const companyRef = dbRef(db, `company/${user.uid}`);
      await update(companyRef, { verificationDocs: uploadedDocs });

      setSnackbarMessage('Documentos enviados e salvos com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setDocuments(null);
      setIsUnderReview(true);
    } catch (error) {
      setSnackbarMessage('Erro ao enviar os documentos. Tente novamente.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      console.error('Erro ao enviar os documentos: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        {isUnderReview ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">Documentos em Avaliação</h1>
            <p className="text-gray-500">
              Seus documentos foram enviados e estão sendo avaliados. O processo de aprovação levará no máximo 2 horas.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">Verifique a sua Empresa</h1>
            <p className="text-gray-500 mb-6">Por favor, envie os documentos que comprovam a existência da sua empresa.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione os documentos (PDF)
                </label>
                <input
                  type="file"
                  id="documents"
                  name="documents"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Enviando...' : 'Enviar Documentos'}
              </Button>
            </form>
          </>
        )}

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default VerifyCompany;
