from PIL import Image

def clean_original_art(input_path, output_path):
    # Abrir a imagem original do usuário
    img = Image.open(input_path).convert("RGBA")
    pixdata = img.load()
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixdata[x, y]
            
            # Identificar os quadrados do fundo "fake"
            # Quadrados brancos (perto de 255)
            # Quadrados cinzas (perto de 195-200)
            is_white_square = (r > 230 and g > 230 and b > 230)
            is_grey_square = (180 < r < 215 and 180 < g < 215 and 180 < b < 215)
            
            if is_white_square or is_grey_square:
                # Se for fundo, tornamos transparente
                pixdata[x, y] = (255, 255, 255, 0)
    
    img.save(output_path, "PNG")

if __name__ == "__main__":
    clean_original_art("/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_vector_raw.jpg", "/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_final.png")
