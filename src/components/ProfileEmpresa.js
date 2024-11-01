import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../fb';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ProfileEmpresa = () => {
  const { id } = useParams(); 
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmpresa = async () => {
      const empresaRef = ref(db, `company/${id}`)
      const snapshot = await get(empresaRef)
      if (snapshot.exists()) {
        setEmpresa(snapshot.val())
        console.log(snapshot.val())
        setBlocked(snapshot.val().blocked || false)
      } else {
        alert('Empresa não encontrada')
        navigate('/gerir-empresas')
      }
      setLoading(false);
    };
    fetchEmpresa();
  }, [id, navigate]);

  const handleDownloadPDF = () => {
    const input = document.getElementById('profile-pdf')
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF()
      pdf.addImage(imgData, 'PNG', 0, 0)
      pdf.save(`${empresa.nome}_perfil.pdf`)
    });
  };

  const handleSendEmail = () => {
    window.location.href = `mailto:${empresa.email}?subject=Contato de ${empresa.nome}&body=Olá ${empresa.responsavel},`
  };

  const handleBlockCompany = async () => {
    await update(ref(db, `company/${id}`), { blocked: !blocked });
    setBlocked(!blocked)
  };

  const handleDeleteCompany = async () => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta empresa?');
    if (confirmDelete) {
      await remove(ref(db, `company/${id}`));
      alert('Empresa excluída com sucesso!');
      navigate('/gerir-empresas');
    }
  };

  if (loading) {
    return <div>Carregando dados...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-lg rounded-md" id="profile-pdf">
      <h1 className="text-2xl font-bold mb-6">Perfil da Empresa</h1>
      
      <div className="flex justify-center mb-6">
        <img 
          src={empresa.logoUrl} 
          alt={`${empresa.nome} logo`} 
          className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
        />
      </div>
      
      <p><strong>Nome:</strong> {empresa.nome}</p>
      <p><strong>Responsável:</strong> {empresa.responsavel}</p>
      <p><strong>Endereço:</strong> {empresa.endereco}</p>
      <p><strong>Província:</strong> {empresa.provincia}</p>
      <p><strong>Contacto:</strong> {empresa.contacto}</p>
      <p><strong>Email:</strong> {empresa.email}</p>
      <p><strong>NUIT:</strong> {empresa.nuit || 'N/A'}</p>
      <p><strong>Sector:</strong> {empresa.sector}</p>
      <p><strong>Senha:</strong> {empresa.senha}</p>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">Assinatura</h2>
      <p><strong>Data de Início:</strong> {new Date(empresa.subscription.startDate).toLocaleDateString()}</p>
      <p><strong>Próximo Pagamento:</strong> {new Date(empresa.subscription.nextPaymentDate).toLocaleDateString()}</p>
      <p><strong>Status da Assinatura:</strong> {empresa.subscription.status ? 'Ativa' : 'Inativa'}</p>
      <p><strong>Status da Empresa:</strong> {blocked ? 'Bloqueada' : 'Ativa'}</p>

      <div className="mt-6 flex space-x-4">
        <button onClick={handleDownloadPDF} className="bg-blue-500 text-white px-4 py-2 rounded">
          Baixar Perfil em PDF
        </button>
        <button onClick={handleSendEmail} className="bg-green-500 text-white px-4 py-2 rounded">
          Enviar Email
        </button>
        <button onClick={handleBlockCompany} className={`px-4 py-2 rounded ${blocked ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
          {blocked ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
        </button>
        <button onClick={handleDeleteCompany} className="bg-red-500 text-white px-4 py-2 rounded">
          Excluir Empresa
        </button>
      </div>
    </div>
  )
}
export default ProfileEmpresa;
