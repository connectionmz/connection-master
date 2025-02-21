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
