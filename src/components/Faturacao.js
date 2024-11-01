import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database'; // Certifique-se de que estás a importar corretamente o Firebase
import { db } from '../fb';
import { useNavigate } from 'react-router-dom';

const Faturacao = ({ user }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [proformas, setProformas] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const invoicesRef = ref(db, `invoices/${user.id}`);
                const snapshot = await get(invoicesRef);
                if (snapshot.exists()) {
                    setProformas(Object.values(snapshot.val()));
                } else {
                    setProformas([]);
                }
            } catch (err) {
                setError('Erro ao carregar proformas.');
            }
        };

        if (user) {
            fetchInvoices();
        }
    }, [user]);

    const filteredProformas = proformas.filter(proforma =>
        proforma.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProformaClick = (proforma) => {
        navigate(`/proforma/${proforma.numeroProforma}`);
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <input
                    type="text"
                    placeholder="Pesquisar proformas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-md p-2 w-1/2"
                />
                <a href='/proforma' className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    Emitir Proforma
                </a>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <table className="w-full border-collapse border border-gray-200">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Nr</th>
                        <th className="border p-2">Cliente</th>
                        <th className="border p-2">Emitido</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProformas.length > 0 ? (
                        filteredProformas.map((proforma, index) => (
                            <tr key={index} className="cursor-pointer" onClick={() => handleProformaClick(proforma)}>
                                <td className="border p-2 text-center">{proforma.numeroProforma}</td>
                                <td className="border p-2">{proforma.cliente || 'Indefinido'}</td>
                                <td className="border p-2 text-center">{proforma.dataEmissao}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="text-center p-4">Nenhuma proforma encontrada</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Faturacao;
