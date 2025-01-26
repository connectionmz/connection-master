import { getDatabase, ref, push, set, get } from "firebase/database";
import { db } from '../fb';
import { SaveLogError } from "../utils/SaveLogError";


export const saveContentToInbox = (userId, notification) => {

  const targetUserNotificationsRef = ref(db, `notifications/${userId}`);
  const newNotificationRef = push(targetUserNotificationsRef); 
  set(newNotificationRef, notification)
    .then(() => console.log("Notificacao adiciona com sucesso"))
    .catch((error) => console.log(error));
}

export const saveContentToInboxBasedSector = (content, idCompany, title, sector) => {
  if (content && idCompany && title) { 
    const inboxRef = ref(db, `company/${idCompany}/inbox`);
    
    const newMessageRef = push(inboxRef);

    const newMessage = {
      title, 
      content, 
      timestamp: new Date().toISOString() 
    };

    return set(newMessageRef, newMessage)
      .then(() => {
        console.log('');
      })
      .catch((error) => {
        console.error('Erro ao salvar a mensagem no inbox: ', error);
        SaveLogError('savetoInbox','Erro ao verificar ou salvar a mensagem no inbox: '+ error)

      });
  }
  return Promise.reject('Content, idCompany, or title is missing.');
};
