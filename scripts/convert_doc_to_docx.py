import os
import subprocess
import time

WORD_ROOT = 'past-papers/Biology/word'

def convert_doc_to_docx(doc_path):
    abs_path = os.path.abspath(doc_path)
    if not abs_path.endswith('.doc'):
        return None
    
    docx_path = abs_path + 'x'
    if os.path.exists(docx_path):
        print(f"Skipping {doc_path}, docx already exists.")
        return docx_path
    
    print(f"Converting {doc_path} to docx...")
    
    # AppleScript to tell Microsoft Word to save as docx
    script = f'''
    tell application "Microsoft Word"
        set is_running to running
        launch
        if not is_running then
            delay 2
        end if
        try
            set inputFile to POSIX file "{abs_path}"
            set outputFile to POSIX file "{docx_path}"
            open inputFile
            set theDoc to active document
            save as theDoc file name outputFile file format format document
            close theDoc saving no
        on error errMsg
            return errMsg
        end try
    end tell
    '''
    
    try:
        subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
        # Check if file was created
        if os.path.exists(docx_path):
            return docx_path
    except subprocess.CalledProcessError as e:
        print(f"Error converting {doc_path}: {e.stderr.decode()}")
    
    return None

def main():
    docs = []
    for root, dirs, files in os.walk(WORD_ROOT):
        for f in files:
            if f.endswith('.doc') and not f.startswith('~$'):
                docs.append(os.path.join(root, f))
    
    print(f"Found {len(docs)} .doc files.")
    
    converted_count = 0
    for doc in docs:
        success = convert_doc_to_docx(doc)
        if success:
            converted_count += 1
            # Rate limit a bit to let Word breathe
            time.sleep(0.5)
            
    print(f"Finished. Converted {converted_count} files.")

if __name__ == '__main__':
    main()
