path = r'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\components\AppleMusicSettingsModal.tsx'
with open(path, 'rb') as f:
    raw = f.read()

# Normalize to \n
raw = raw.replace(b'\r\n', b'\n')

target = b'            </div>\n            </>\n          )}\n\n          {(activeCategory === "all" || activeCategory === "visuals") && ('
replacement = b'            </div>\n          </div>\n            </>\n          )}\n\n          {(activeCategory === "all" || activeCategory === "visuals") && ('

if target in raw:
    raw = raw.replace(target, replacement)
    print("Found and replaced target!")
else:
    print("Target not found!")

# Convert back to CRLF
raw = raw.replace(b'\n', b'\r\n')
with open(path, 'wb') as f:
    f.write(raw)
