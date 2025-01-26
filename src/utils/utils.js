import icone from '../img/bg2.png';


export var mUser = JSON.parse(localStorage.getItem('user'));
export var mCompany = JSON.parse(localStorage.getItem('company'));
export var logo = icone


const handleRespondToConnection = (fromUserId, action) => {
    const currentUserId = "currentUserId"; // ID do usuário logado
    const db = getDatabase();
  
    const targetUserConnectionRef = ref(db, `connections/${currentUserId}/${fromUserId}`);
    const requesterConnectionRef = ref(db, `connections/${fromUserId}/${currentUserId}`);
  
    const newStatus = action === "accept" ? "connected" : "rejected";
  
    // Atualiza o status nos dois perfis
    const updates = {};
    updates[`connections/${currentUserId}/${fromUserId}/status`] = newStatus;
    updates[`connections/${fromUserId}/${currentUserId}/status`] = newStatus;
  
    update(ref(db), updates)
      .then(() => {
        alert(
          action === "accept"
            ? "Conexão aceita com sucesso!"
            : "Solicitação rejeitada."
        );
      })
      .catch((error) => {
        console.error("Erro ao responder à solicitação:", error);
        alert("Erro ao tentar responder. Tente novamente.");
      });
  };
  