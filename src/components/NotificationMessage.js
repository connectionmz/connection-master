import React, { useEffect, useState } from 'react';
import { NotificationsActive } from '@mui/icons-material';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb'; // Import your Firebase configuration
import { useUser } from '../context/UserProfileContext';

const NotificationMessage = () => {
  const { userData: user } = useUser();
  const idCompany = user?.id;

  const [unopenedCount, setUnopenedCount] = useState(0);

  useEffect(() => {
    if (idCompany) {
      const inboxRef = ref(db, `company/${idCompany}/inbox`);
      
      const unsubscribe = onValue(inboxRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert the data object to an array of messages
          const messagesArray = Object.values(data);
          // Count unopened notifications
          const unopenedMessages = messagesArray.filter(message => !message.opened);
          setUnopenedCount(unopenedMessages.length);
        } else {
          setUnopenedCount(0); // Ensure to reset count if no data
        }
      });

      // Clean up the subscription on component unmount
      return () => unsubscribe();
    }
  }, [idCompany]);

  if (unopenedCount === 0) {
    return null; // Return null if no unopened notifications
  }

  return (
    <div className="flex items-center bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-md">
      <NotificationsActive className="text-blue-600 mr-3" />
      <div className="flex flex-col">
        <h4 className="text-blue-700 font-semibold">
          {unopenedCount} Nova(s) Notificação(ões)
        </h4>
      </div>
    </div>
  );
};

export default NotificationMessage;
