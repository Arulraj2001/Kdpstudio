const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.ts');
const part1 = fs.readFileSync(path.join(__dirname, 'stripe-routes-part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(__dirname, 'stripe-routes-part2.txt'), 'utf8');

const lines = fs.readFileSync(serverPath, 'utf8').split('\n');

// Find start: line whose trimmed content is '// Razorpay Create Subscription'
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '// Razorpay Create Subscription') {
    startIdx = i;
    break;
  }
}
if (startIdx === -1) {
  console.error('Could not find Razorpay create-subscription start marker');
  process.exit(1);
}

// Find the "UPI DIRECT & ADMIN ENDPOINTS" section comment to know where RZ/PP block ends
let upiIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('UPI DIRECT & ADMIN ENDPOINTS')) {
    upiIdx = i;
    break;
  }
}
if (upiIdx === -1) {
  console.error('Could not find UPI DIRECT section marker');
  process.exit(1);
}

// Remove from startIdx up to (but not including) the blank line before the UPI separator block.
// upiIdx points at the '// UPI DIRECT...' line. There are two separator comment lines before it.
// We keep everything from index (upiIdx - 2) onward (blank line handled by keeping separator).
let endExclusive = upiIdx - 2;
// Walk backwards to drop trailing blank lines in the removed region
while (endExclusive > startIdx && lines[endExclusive - 1].trim() === '') {
  endExclusive--;
}

const newBlock = part1.trimEnd() + '\n' + '\n' + part2.trimEnd();
const result = lines.slice(0, startIdx).concat(newBlock.split('\n'), lines.slice(endExclusive));

fs.writeFileSync(serverPath, result.join('\n'), 'utf8');
console.log('Spliced server.ts. Removed block indices', startIdx, 'to', endExclusive - 1);
console.log('Total lines before:', lines.length, 'after:', result.length);