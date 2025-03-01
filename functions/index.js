const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Certifica-te que o caminho está correto

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://connections-d1be1-default-rtdb.firebaseio.com",
});

const db = admin.database();
const auth = admin.auth();

async function migrarEmpresas() {
  try {
    // Passo 1: Obter todos os usuários do Firebase Authentication
    const users = await auth.listUsers();
    const userMap = {};

    users.users.forEach((user) => {
      userMap[user.uid] = true; // Mapeia os IDs existentes no Authentication
    });

    // Passo 2: Buscar todas as empresas na Realtime Database
    const empresasRef = db.ref("company");
    const snapshot = await empresasRef.once("value");

    if (snapshot.exists()) {
      const updates = {};
      const deleteKeys = [];

      snapshot.forEach((childSnapshot) => {
        const empresa = childSnapshot.val();
        const empresaId = empresa.id;

        // Verifica se o ID da empresa existe no Authentication
        if (!userMap[empresaId]) {
          // Se o ID não existir, marca para exclusão
          deleteKeys.push(childSnapshot.key);
        } else if (!empresa.subscriptions) {
          // Se a empresa não tiver o campo subscriptions, adiciona com valores padrão
          updates[`company/${empresaId}/subscriptions`] = {
            isverify: "false",
            status: "active",
          };
        }
      });

      // Passo 3: Atualizar a base de dados
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        console.log("Subscriptions adicionadas com sucesso!");
      } else {
        console.log("Nenhuma empresa necessitou de atualização de subscriptions.");
      }

      // Passo 4: Remover as empresas cujos IDs não existem no Authentication
      if (deleteKeys.length > 0) {
        for (const oldKey of deleteKeys) {
          await db.ref(`company/${oldKey}`).remove();
        }
        console.log(`${deleteKeys.length} empresas removidas.`);
      } else {
        console.log("Nenhuma empresa foi removida.");
      }
    } else {
      console.log("Nenhuma empresa encontrada.");
    }
  } catch (error) {
    console.error("Erro ao migrar empresas:", error);
  }
}

// Executar a função
migrarEmpresas();