import requests
import urllib3
urllib3.disable_warnings()
from bs4 import BeautifulSoup
import json

r = requests.get('https://ltu.edu.np/notice', verify=False)
soup = BeautifulSoup(r.text, 'html.parser')

notices = []
# Assuming the notices are in some repeating div. Let's find links to notice-detail
for a in soup.find_all('a', href=True):
    if '/notice-detail/' in a['href']:
        title = a.text.strip()
        link = a['href']
        # Try to find date. Date might be in a preceding element, or sibling
        # Let's just find the parent div and get all text to see what it looks like
        parent_text = a.parent.parent.text.strip()
        notices.append({
            'title': title,
            'link': link,
            'parent_text': parent_text
        })

with open('scraped_notices_debug.json', 'w', encoding='utf-8') as f:
    json.dump(notices[:10], f, ensure_ascii=False, indent=2)
