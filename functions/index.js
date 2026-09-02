const admin = require("firebase-admin");

admin.initializeApp({
  databaseURL: "https://connections-d1be1-default-rtdb.firebaseio.com",
});

const auth = admin.auth();

async function removerUsuariosAntigos() {
  try {
    // Data de corte: 18 de fevereiro de 2025
    const dataCorte = new Date("2025-02-18T00:00:00Z").getTime(); // Convertendo para timestamp

    // Passo 1: Obter todos os usuários do Firebase Authentication
    const users = await auth.listUsers();
    const usersToDelete = []; // Para armazenar os UIDs dos usuários a serem removidos

    // Passo 2: Verificar a data de criação de cada usuário
    users.users.forEach((user) => {
      const dataCriacao = new Date(user.metadata.creationTime).getTime(); // Convertendo para timestamp

      // Se a data de criação for anterior à data de corte, marca para exclusão
      if (dataCriacao < dataCorte) {
        usersToDelete.push(user.uid);
        console.log(`Usuário marcado para exclusão: ${user.email} (UID: ${user.uid}) - Criado em: ${user.metadata.creationTime}`);
      }
    });

    // Passo 3: Remover os usuários marcados do Firebase Authentication
    if (usersToDelete.length > 0) {
      await auth.deleteUsers(usersToDelete);
      console.log(`${usersToDelete.length} usuários removidos do Firebase Authentication.`);
    } else {
      console.log("Nenhum usuário com data de criação anterior a 18 de fevereiro de 2025 foi encontrado.");
    }
  } catch (error) {
    console.error("Erro ao remover usuários:", error);
  }
}

// Executar a função
removerUsuariosAntigos();
