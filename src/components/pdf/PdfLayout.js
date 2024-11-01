import React from 'react';

const PdfLayout = ({ logoUrl, title, children }) => {
    return (
        <div className="pdf-layout">
            {/* Cabeçalho com logotipo */}
            <header className="p-4 bg-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                    <img 
                        src={logoUrl || 'https://via.placeholder.com/150'} 
                        alt="Logo" 
                        className="w-24 h-24 object-cover" 
                    />
                    <h1 className="ml-4 text-2xl font-bold">{title}</h1>
                </div>
            </header>

            {/* Corpo do conteúdo */}
            <main className="p-6">
                {children}
            </main>
        </div>
    );
};

export default PdfLayout;
