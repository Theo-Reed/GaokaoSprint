
import os
import json
import urllib.request

ENV_PATH = '/Users/yeatom/VSCodeProjects/gaokao/.env'
keys = {}
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                keys[key] = value

API_KEY = keys.get('GEMINI_API_KEY')
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    with urllib.request.urlopen(url) as res:
        data = json.loads(res.read())
        print("Available models:")
        for m in data.get('models', []):
            if 'generateContent' in m['supportedGenerationMethods']:
                print(f"- {m['name']}")
except Exception as e:
    print(f"Error listing models: {e}")
