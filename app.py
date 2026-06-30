import os
import re
import html
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Cache variables (in-memory) to avoid hitting Google's feeds on every page reload
feed_cache = None

def strip_html_and_clean(html_content):
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Unescape HTML entities
    text = html.unescape(text)
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    
    with urllib.request.urlopen(req) as response:
        content = response.read()
        
    root = ET.fromstring(content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    parsed_entries = []
    
    for entry in entries:
        title = entry.find('atom:title', ns).text  # e.g., "June 29, 2026"
        updated = entry.find('atom:updated', ns).text
        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        content_html = entry.find('atom:content', ns).text
        
        # Split entry content by <h3> headers
        parts = re.split(r'<h3[^>]*>(.*?)</h3>', content_html, flags=re.DOTALL)
        
        items = []
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                category = parts[i].strip()
                body_html = parts[i+1].strip() if i+1 < len(parts) else ""
                body_text = strip_html_and_clean(body_html)
                
                items.append({
                    "category": category,
                    "body_html": body_html,
                    "body_text": body_text
                })
        else:
            body_text = strip_html_and_clean(content_html)
            items.append({
                "category": "General",
                "body_html": content_html,
                "body_text": body_text
            })
            
        parsed_entries.append({
            "date": title,
            "updated": updated,
            "link": link,
            "updates": items
        })
        
    return parsed_entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    global feed_cache
    try:
        # Fetch fresh notes
        notes = parse_release_notes()
        feed_cache = notes
        return jsonify({"status": "success", "data": notes})
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Fallback to cache if available
        if feed_cache:
            return jsonify({
                "status": "error", 
                "message": str(e), 
                "data": feed_cache, 
                "note": "Returned cached data due to fetch error"
            })
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
