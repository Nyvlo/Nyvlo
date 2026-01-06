from PIL import Image

def aggressive_clean(input_path, output_path):
    # Abrir a imagem original (o JPG com artefatos)
    img = Image.open(input_path).convert("RGBA")
    pixdata = img.load()
    width, height = img.size
    
    # Cores principais do logo para proteção (opcional, mas ajuda)
    # Navy: (29, 61, 107), Green: (89, 195, 72), Light Blue: (78, 174, 229)
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixdata[x, y]
            
            # 1. Remover tudo que for muito claro (perto do branco absoluto)
            # JPG artifacts em fundos brancos costumam variar entre 240-255
            if r > 235 and g > 235 and b > 235:
                pixdata[x, y] = (255, 255, 255, 0)
                continue

            # 2. Remover a grade cinza "fake"
            # Os quadrados cinzas costumam ter R, G, B muito próximos um do outro (dessaturados)
            # e brilho intermediário.
            is_grey_range = (180 < r < 220 and 180 < g < 220 and 180 < b < 220)
            is_neutral = abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15
            
            if is_grey_range and is_neutral:
                pixdata[x, y] = (255, 255, 255, 0)
                continue

            # 3. Remover resíduos de compressão (noise)
            # Se a cor é muito clara e quase cinza, limpamos
            if (r + g + b) > 650 and is_neutral:
                pixdata[x, y] = (255, 255, 255, 0)
                continue

    # Opcional: Aplicar um leve alpha nas bordas para suavizar (antialiasing manual básico)
    # Por enquanto vamos focar em remover os "pontos" que o usuário viu.
    
    img.save(output_path, "PNG")
    print(f"Limpeza agressiva concluída: {output_path}")

if __name__ == "__main__":
    # Usando o arquivo raw original para não acumular erros
    aggressive_clean("/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_vector_raw.jpg", "/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_final.png")
