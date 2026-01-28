
import os

MATH_PAPERS_DIR = "/Users/yeatom/VSCodeProjects/gaokao/past-papers/Math"
NATIONAL_KEYWORDS = ['全国', '新课标', '新高考', '甲卷', '乙卷', '课标', '新教材']

def is_national(filename):
    for kw in NATIONAL_KEYWORDS:
        if kw in filename:
            return True
    return False

def cleanup():
    if not os.path.exists(MATH_PAPERS_DIR):
        print(f"Directory not found: {MATH_PAPERS_DIR}")
        return

    deleted_count = 0
    kept_count = 0

    # Walk through year folders
    for root, dirs, files in os.walk(MATH_PAPERS_DIR):
        # Skip the scripts folder itself if it were inside, but it's not.
        if 'scripts' in root:
            continue
            
        for file in files:
            if file.endswith('.pdf'):
                if is_national(file):
                    kept_count += 1
                else:
                    file_path = os.path.join(root, file)
                    try:
                        os.remove(file_path)
                        # print(f"Deleted: {file}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"Error deleting {file}: {e}")

    print(f"Cleanup complete.")
    print(f"Deleted {deleted_count} provincial/local papers.")
    print(f"Kept {kept_count} national papers.")

if __name__ == "__main__":
    cleanup()
