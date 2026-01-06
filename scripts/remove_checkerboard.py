from PIL import Image

def remove_checkerboard(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    pixdata = img.load()
    
    # Sample multiple points to find background colors
    # We assume the background is a checkerboard of two colors
    bg_colors = set()
    for x in [0, 16, 32, 48]:
        for y in [0, 16, 32, 48]:
            bg_colors.add(pixdata[x, y][:3])
            
    print(f"Detected potential background colors: {bg_colors}")
    
    width, height = img.size
    for y in range(height):
        for x in range(width):
            if pixdata[x, y][:3] in bg_colors:
                pixdata[x, y] = (255, 255, 255, 0)
                
    img.save(output_path)
    print(f"Processed image saved to {output_path}")

if __name__ == "__main__":
    remove_checkerboard("/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_vector_raw.jpg", "/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_vector_no_bg.png")
