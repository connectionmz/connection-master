import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../fb';

const CreateUsers = () => {
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        try {
            const companiesRef = ref(db, 'users'); // Caminho para empresas no banco
            const snapshot = await get(companiesRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                const companyList = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));

                // Criar usuários para cada empresa
                for (const company of companyList) {
                    if (company.email) {
                        try {
                            const userCredential = await createUserWithEmailAndPassword(
                                auth,
                                company.email,
                                '123456' // Define a senha como 123456
                            );

                            console.log(`Usuário criado para ${company.email}:`, userCredential.user);
                        } catch (error) {
                            console.error(`Erro ao criar usuário para ${company.email}:`, error.message);
                        }
                    } else {
                        console.warn(`Empresa ${company.id} não possui email.`);
                    }
                }
            } else {
                console.log('Nenhuma empresa encontrada.');
            }
        } catch (error) {
            console.error('Erro ao buscar empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    return (
        <div>
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <p>Usuários criados para todas as empresas com email válido.</p>
            )}
        </div>
    );
};

export default CreateUsers;
