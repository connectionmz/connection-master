import { ref, push, set } from "firebase/database";
import { db } from "../fb";

export const SaveLogError = (component, error) => {
  if (!component || !error) {
    console.error("O nome do componente ou o erro não foram fornecidos.");
    return Promise.reject("O nome do componente ou o erro não foram fornecidos.");
  }

  const logsRef = ref(db, "logs/errors");
  const newLogRef = push(logsRef); 
  const logEntry = {
    component: component,
    error: typeof error === "string" ? error : JSON.stringify(error),
    timestamp: new Date().toISOString(), 
  };

  return set(newLogRef, logEntry)
    .then(() => {
      console.log("Log de erro salvo com sucesso!");
    })
    .catch((err) => {
      console.error("Erro ao salvar o log no banco de dados: ", err);
    });
};
