import React, { useEffect, useState } from 'react';
import { auth, db } from '../fb';
import { onValue } from 'firebase/database';

const User = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const user = auth.currentUser;

        if (user) {
            const userRef = ref(db, 'users/' + user.uid);

            // Listener para os dados do usuário
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                setUserData(data);
            });
        } else {
            console.log("Usuário não autenticado");
        }
    }, []);

    if (!userData) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Perfil do Usuário</h2>
            <p><strong>Nome:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Idade:</strong> {userData.age}</p>
            {/* Adicione outros dados do usuário conforme necessário */}
        </div>
    );
}

export default User;
