import { useState } from "react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../fb";

const ChangePasswordDesk = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (newPassword !== confirmPassword) {
      setFeedback({ message: "As senhas não coincidem.", error: true });
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      setFeedback({ message: "Usuário não autenticado.", error: true });
      setLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      setFeedback({ message: "Senha atualizada com sucesso!", error: false });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error.message);
      setFeedback({ message: "Erro ao atualizar a senha. Verifique as informações.", error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Mudar Senha</h2>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="mb-4">
          <label className="block font-medium mb-1">Senha Atual</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Nova Senha</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Confirmar Nova Senha</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="border p-2 w-full rounded"
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
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar Senha"}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordDesk;