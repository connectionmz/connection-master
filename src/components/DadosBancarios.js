import { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import { getAuth } from "firebase/auth"; 

const DadosBancarios = ({ user }) => {
  const [formData, setFormData] = useState({
    banco: "BCI",
    numeroConta: "",
    titularConta: user.nome,
    tipoConta: "Poupança",
    nib: "",
    iban: "",
  });

  const [feedback, setFeedback] = useState({ message: "", error: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numeroConta || !formData.titularConta) {
      setFeedback({ message: "Por favor, preencha todos os campos obrigatórios.", error: true });
      return;
    }

    try {
      // Configuração do Realtime Database
      const db = getDatabase();
      const userId = user?.id || getAuth().currentUser?.uid;

      if (!userId) {
        throw new Error("ID do usuário não encontrado.");
      }

      // Referência para o caminho: company/{user.id}/bankDetails
      const bankDetailsRef = ref(db, `company/${userId}/bankDetails`);

      // Gerar um ID único e salvar os dados
      await push(bankDetailsRef, formData);

      setFeedback({ message: "Dados bancários cadastrados com sucesso!", error: false });

      // Reset do formulário
      setFormData({
        banco: "BCI",
        numeroConta: "",
        titularConta: "",
        tipoConta: "Poupança",
        nib: "",
        iban: "",
      });
    } catch (error) {
      console.error("Erro ao salvar dados bancários:", error);
      setFeedback({ message: "Erro ao salvar os dados bancários. Tente novamente.", error: true });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dados Bancários</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block font-medium mb-1">Banco</label>
          <select
            name="banco"
            value={formData.banco}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
          >
            <option value="BCI">Banco Comercial e de Investimentos (BCI)</option>
            <option value="BIM">Millennium BIM</option>
            <option value="FNB">First National Bank (FNB)</option>
            <option value="Standard Bank">Standard Bank</option>
            <option value="ABSA">ABSA Bank Moçambique</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Número da Conta</label>
          <input
            type="text"
            name="numeroConta"
            value={formData.numeroConta}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder={`Ex: ${
              formData.banco === "BCI"
                ? "1234567890123"
                : formData.banco === "BIM"
                ? "2345678901234"
                : "3456789012345"
            }`}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Titular da Conta</label>
          <input
            type="text"
            name="titularConta"
            value={formData.titularConta}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder="Nome completo do titular"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Tipo de Conta</label>
          <select
            name="tipoConta"
            value={formData.tipoConta}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
          >
            <option value="Poupança">Poupança</option>
            <option value="Corrente">Corrente</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">NIB (Número de Identificação Bancária)</label>
          <input
            type="text"
            name="nib"
            value={formData.nib}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder="Ex: 123456789012345678901"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">IBAN</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder="Ex: MZ59000123456789012345"
          />
        </div>
        {feedback.message && (
          <div
            className={`p-2 rounded ${
              feedback.error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            }`}
          >
            {feedback.message}
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full"
        >
          Cadastrar Dados Bancários
        </button>
      </form>
    </div>
  );
};

export default DadosBancarios;
