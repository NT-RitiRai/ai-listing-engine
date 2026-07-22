import os

path = r"c:\Users\ASUS\Downloads\ai-listing-engine\frontend\app\analysis\[id]\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '{isComplete && (\n              <button',
    '{isComplete && (\n              <>\n              <button'
)

content = content.replace(
    'Generate AI Summary"}</button>\n            )}',
    'Generate AI Summary"}</button>\n              </>\n            )}'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed JSX fragment in page.tsx")
