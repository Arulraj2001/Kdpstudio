const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'src', 'components', 'public', 'PricingPageView.tsx');
const lines = fs.readFileSync(p, 'utf8').split('\n');

// Find start: line containing 'Interactive Checkout Modal'
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Interactive Checkout Modal')) { start = i; break; }
}
// Find start of the block: the line before a '      {selectedPlanForCheckout && (' following the comment
// We'll locate the '      {selectedPlanForCheckout && (' line
let condStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('selectedPlanForCheckout && (')) { condStart = i; break; }
}
if (start === -1) { console.error('comment not found'); process.exit(1); }
if (condStart === -1) { console.error('cond not found'); process.exit(1); }

// Remove from 'start' (the comment) OR from condStart whichever earlier.
const removeStart = Math.min(start, condStart);

// Find the end: the '      )}' that closes the selectedPlanForCheckout block.
// The block ends at the last '      )}' before the '    </div>' closing the component return.
// Strategy: scan from removeStart forward; track a '{' depth? The block is JSX conditional.
// Simpler: find the line '        </div>' just before the final '      )}' then '    </div>'.
// Known tail (after block): "      )}\n\n    </div>\n  );\n};"
// So locate the line that is exactly '      )}' followed later by '    </div>'.
let removeEnd = -1;
for (let i = removeStart; i < lines.length; i++) {
  if (lines[i].trim() === ')}' ) {
    // check following non-empty line is '    </div>'
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (lines[j] && lines[j].trim() === '</div>') {
      removeEnd = i; // keep through the ')}' ? We'll remove up to before this line.
      break;
    }
  }
}
if (removeEnd === -1) { console.error('end not found'); process.exit(1); }

// Remove lines [removeStart, removeEnd] inclusive, but keep the ')}' handle? Actually we remove the whole conditional block (comment + cond + content). The '      )}' presumably belongs to the outer 'return (' close. Wait - the component 'return (' opens with <div> ... many sections ... then the modal block, then '    </div>'. The '      )}' after the modal closes the modal's internal conditional, NOT the main return. 

// Let me reconsider: The block is:
//   {/* Interactive Checkout Modal */}
//   {selectedPlanForCheckout && (
//     <div>...</div>
//   )}
//   </div>   <- this closes main return's root div
//   );
// };
// So the ')}' at removeEnd+? directly before '</div>' is the CLOSER of `{selectedPlanForCheckout && (`.

// We remove from removeStart (comment) through removeEnd inclusive (the ')}').
const result = lines.slice(0, removeStart).concat(lines.slice(removeEnd + 1));
fs.writeFileSync(p, result.join('\n'), 'utf8');
console.log('Removed lines', removeStart, 'to', removeEnd, 'inclusive. Old lines:', lines.length, 'new:', result.length);