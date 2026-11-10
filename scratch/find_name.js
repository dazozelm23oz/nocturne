const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\Ziad\\.gemini\\antigravity\\brain\\6cfc105f-e631-425d-8703-d01bb68cb0be\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"')) {
      try {
        const obj = JSON.parse(line);
        const text = (obj.content || '').toLowerCase();
        if (text.includes('name') || text.includes('call') || text.includes('rename') || text.includes('title') || text.includes('instead of lirics')) {
          console.log(`Step ${obj.step_index}: ${obj.content}\n---`);
        }
      } catch (e) {}
    }
  }
}
search();
