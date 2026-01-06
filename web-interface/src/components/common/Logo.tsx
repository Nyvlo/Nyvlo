import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, size = 220, animated = true }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`relative ${animated ? 'hover:scale-105 transition-all duration-500' : ''}`}
                style={{ width: size, height: size }}
            >
                {/* 
                   A SUA IMAGEM ORIGINAL 
                   Processamos apenas para remover os quadrados de fundo "fake".
                   A arte, as cores e o design são 100% os seus.
                */}
                <img
                    src="/assets/logo_final.png"
                    alt="Nyvlo Logo"
                    className="w-full h-full object-contain filter contrast-[1.02] brightness-[1.01]"
                />
            </div>
        </div>
    );
};

export default Logo;
