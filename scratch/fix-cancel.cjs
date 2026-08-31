const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, '..', 'server.ts');
const src = fs.readFileSync(serverPath, 'utf8');
const lines = src.split('\n');

// 1. Replace the two gateway-cancel imports with the Stripe one
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('cancelPayPalSubscription') && lines[i].includes('./src/lib/paypal')) {
    lines[i] = lines[i].replace(/cancelPayPalSubscription.*?\.\/src\/lib\/paypal.*/, 'const { cancelStripeSubscription } = await import(\'./src/lib/stripe\');');
  }
}
// remove the cancelRazorpaySubscription import line
const cleaned = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('cancelRazorpaySubscription') && lines[i].includes('./src/lib/razorpay')) {
    continue;
  }
  cleaned.push(lines[i]);
}

// 2. Replace the gateway if-block
const outLines = [];
for (let i = 0; i < cleaned.length; i++) {
  const l = cleaned[i];
  if (l.includes("activeSub.gateway === 'razorpay'") || l.includes('cancelRazorpaySubscription(')) {
    // skip razorpay branch lines
    continue;
  }
  if (l.includes("activeSub.gateway === 'paypal'") || l.includes('cancelPayPalSubscription(')) {
    continue;
  }
  if (l.includes('} else if (activeSub.gateway')) {
    continue;
  }
  outLines.push(l);
}
// Insert the stripe branch before the closing of the if(activeSub) block
// Find the line that is '        }' following where the branch was (the closing of if(activeSub))
// We'll simply insert after any line exactly equal to '' before 'await updateSubscriptionRecord'
// Simpler: locate 'await updateSubscriptionRecord(activeSub.id' and insert the stripe if before it is fine since we removed branches

let final = [];
let inserted = false;
for (let i = 0; i < outLines.length; i++) {
  const l = outLines[i];
  if (!inserted && l.includes('await updateSubscriptionRecord(activeSub.id')) {
    final.push('        if (activeSub.gateway === \'stripe\' && activeSub.gatewaySubscriptionId) {');
    final.push('          await cancelStripeSubscription(activeSub.gatewaySubscriptionId, reason);');
    final.push('        }');
    inserted = true;
  }
  final.push(l);
}
if (!inserted) {
  console.error('Did not find insertion anchor for stripe cancel branch');
  process.exit(1);
}
fs.writeFileSync(serverPath, final.join('\n'), 'utf8');
console.log('cancel-subscription updated');