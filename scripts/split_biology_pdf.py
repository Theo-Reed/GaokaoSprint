import os
from pypdf import PdfReader, PdfWriter

def split_pdf(input_path, output_dir, segments):
    """
    segments: [{"name": "filename.pdf", "start": 1, "end": 10}, ...] (1-based page numbers)
    """
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} not found.")
        return

    reader = PdfReader(input_path)
    total_pages = len(reader.pages)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for seg in segments:
        writer = PdfWriter()
        start_idx = max(0, seg["start"] - 1)
        end_idx = min(total_pages - 1, seg["end"] - 1)
        
        for i in range(start_idx, end_idx + 1):
            writer.add_page(reader.pages[i])
        
        output_path = os.path.join(output_dir, seg["name"])
        with open(output_path, "wb") as f:
            writer.write(f)
        print(f"Created: {output_path} (Pages {seg['start']} to {seg['end']})")

if __name__ == "__main__":
    # Base configuration
    BASE_DIR = "/Users/yeatom/VSCodeProjects/gaokao/next-app/public/biology"
    INPUT_FILE = os.path.join(BASE_DIR, "book_sc1.pdf")
    
    # Define segments for SC1 Chapters
    # These ranges are estimated to cover the requested knowledge points + context
    segments = [
        {"name": "sc1_ch2.pdf", "start": 16, "end": 45}, # Neuro
        {"name": "sc1_ch3.pdf", "start": 46, "end": 68}, # Hormone
        {"name": "sc1_ch4.pdf", "start": 69, "end": 95}, # Immune
    ]
    
    split_pdf(INPUT_FILE, BASE_DIR, segments)
