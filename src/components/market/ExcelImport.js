import React from 'react';
import * as XLSX from 'xlsx';
import { ref, push } from 'firebase/database';
import { db } from '../../fb';

const ExcelImport = ({ storeId, handleProductAdd }) => {
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
    
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const products = XLSX.utils.sheet_to_json(worksheet);
    
            const newProducts = [];
            for (let product of products) {
                // Verifica se o campo que você vai acessar é uma string antes de usar toLowerCase
                if (product.name && typeof product.name === 'string') {
                    const normalizedProductName = product.name.toLowerCase();  // Supondo que você esteja usando toLowerCase no nome
                }
    
                const productRef = ref(db, `stores/${storeId}/products`);
                await push(productRef, product);
                newProducts.push([null, product]);
            }
    
            handleProductAdd(newProducts);
        };
    
        reader.readAsArrayBuffer(file);
    };
    

    return (
        <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold">Importar Produtos via Excel:</label>
            <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="border p-2 rounded"
            />
        </div>
    );
};

export default ExcelImport;
