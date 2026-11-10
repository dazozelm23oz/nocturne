path = r'C:\Users\Ziad\.gemini\antigravity\scratch\lirics\components\AppleMusicSettingsModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """            </>
          )}

          </div>
        </div>
      </div>
    </div>
  </div>
);
}"""

replacement = """            </>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}"""

if target in text:
    text = text.replace(target, replacement)
    print("Replaced extra div!")
else:
    print("Target not found!")

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
