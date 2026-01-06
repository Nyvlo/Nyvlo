from PIL import Image
import os

def remove_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    # Threshold for what we consider "white"
    threshold = 240
    
    for item in datas:
        # Check if pixel is near white
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Make it transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Background removed and saved to {output_path}")

if __name__ == "__main__":
    input_file = "/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_official.png"
    output_file = "/home/wesley/Documentos/projetos/Nyvlo Omnichannel/web-interface/public/assets/logo_no_bg.png"
    remove_background(input_file, output_file)
