import { useState, useEffect } from "react";
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { getAuth } from "firebase/auth";

const DadosBancarios = ({ user }) => {
  const [formData, setFormData] = useState({
    banco: "BCI",
    numeroConta: "",
    titularConta: user.nome,
    nib: "",
    iban: "",
  });

  const [dadosBancarios, setDadosBancarios] = useState([]);
  const [activeTab, setActiveTab] = useState("cadastrar");
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const fetchDadosBancarios = async () => {
      try {
        const db = getDatabase();
        const userId = user?.id || getAuth().currentUser?.uid;

        if (!userId) {
          throw new Error("ID do usuário não encontrado.");
        }

        const bankDetailsRef = ref(db, `company/${userId}/bankDetails`);
        onValue(bankDetailsRef, (snapshot) => {
          const data = snapshot.val();
          const lista = data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : [];
          setDadosBancarios(lista);
        });
      } catch (error) {
        console.error("Erro ao buscar dados bancários:", error);
      }
    };

    fetchDadosBancarios();
  }, [user]);

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

    setLoading(true);

    try {
      const db = getDatabase();
      const userId = user?.id || getAuth().currentUser?.uid;

      if (!userId) {
        throw new Error("ID do usuário não encontrado.");
      }

      const bankDetailsRef = ref(db, `company/${userId}/bankDetails`);

      if (editId) {
        const editRef = ref(db, `company/${userId}/bankDetails/${editId}`);
        await update(editRef, formData);
        setFeedback({ message: "Dados bancários atualizados com sucesso!", error: false });
        setEditId(null);
      } else {
        await push(bankDetailsRef, formData);
        setFeedback({ message: "Dados bancários cadastrados com sucesso!", error: false });
      }

      setFormData({
        banco: "BCI",
        numeroConta: "",
        titularConta: user.nome,
        nib: "",
        iban: "",
      });
    } catch (error) {
      console.error("Erro ao salvar dados bancários:", error);
      setFeedback({ message: "Erro ao salvar os dados bancários. Tente novamente.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    const toEdit = dadosBancarios.find((dado) => dado.id === id);
    setFormData(toEdit);
    setEditId(id);
    setActiveTab("cadastrar");
  };

  const handleDelete = async (id) => {
    try {
      const db = getDatabase();
      const userId = user?.id || getAuth().currentUser?.uid;

      if (!userId) {
        throw new Error("ID do usuário não encontrado.");
      }

      const deleteRef = ref(db, `company/${userId}/bankDetails/${id}`);
      await remove(deleteRef);
      setFeedback({ message: "Dados bancários removidos com sucesso!", error: false });
    } catch (error) {
      console.error("Erro ao remover dados bancários:", error);
      setFeedback({ message: "Erro ao remover os dados bancários. Tente novamente.", error: true });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestão de Dados Bancários</h2>
      <div className="flex space-x-4 mb-6">
        <button
          className={`py-2 px-4 ${activeTab === "cadastrar" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("cadastrar")}
        >
          Cadastrar Dados Bancários
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "exibir" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => setActiveTab("exibir")}
        >
          Exibir Dados Bancários
        </button>
      </div>

      {feedback.message && (
        <div className={`p-2 mb-4 ${feedback.error ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"}`}>
          {feedback.message}
        </div>
      )}

      {activeTab === "cadastrar" && (
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
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Cadastrar Dados Bancários"}
          </button>
        </form>
      )}

      {activeTab === "exibir" && (
        <div>
          <h3 className="text-lg font-bold mb-4">Lista de Dados Bancários</h3>
          {dadosBancarios.length > 0 ? (
            <ul className="space-y-4">
              {dadosBancarios.map((dado) => (
                <li key={dado.id} className="border p-4 rounded shadow">
                  <p><strong>Banco:</strong> {dado.banco}</p>
                  <p><strong>Conta:</strong> {dado.numeroConta}</p>
                  <p><strong>Titular:</strong> {dado.titularConta}</p>
                  <div className="flex space-x-4 mt-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
                      onClick={() => handleEdit(dado.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                      onClick={() => handleDelete(dado.id)}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Nenhum dado bancário cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DadosBancarios;
