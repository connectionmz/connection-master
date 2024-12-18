import { useState } from "react";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth } from "firebase/auth";

const DadosEmpresariais = ({ user }) => {
  const [formData, setFormData] = useState({
    nuit: "",
    nuel: "",
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

    if (!formData.nuit || !formData.nuel) {
      setFeedback({ message: "Por favor, preencha todos os campos obrigatórios.", error: true });
      return;
    }

    try {
      // Configuração do Firebase Database
      const db = getDatabase();
      const userId = user?.id || getAuth().currentUser?.uid;

      if (!userId) {
        throw new Error("ID do usuário não encontrado.");
      }

      // Referência para o caminho: company/{user.id}/businessDetails
      const businessDetailsRef = ref(db, `company/${userId}/businessDetails`);

      // Salvar os dados empresariais
      await set(businessDetailsRef, formData);

      setFeedback({ message: "Dados empresariais cadastrados com sucesso!", error: false });

      // Reset do formulário
      setFormData({ nuit: "", nuel: "" });
    } catch (error) {
      console.error("Erro ao salvar dados empresariais:", error);
      setFeedback({ message: "Erro ao salvar os dados empresariais. Tente novamente.", error: true });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dados Empresariais</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block font-medium mb-1">NUIT</label>
          <input
            type="text"
            name="nuit"
            value={formData.nuit}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder="Ex: 123456789"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">NUEL</label>
          <input
            type="text"
            name="nuel"
            value={formData.nuel}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            placeholder="Ex: 987654321"
            required
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
          Cadastrar Dados Empresariais
        </button>
      </form>
    </div>
  );
};

export default DadosEmpresariais;
