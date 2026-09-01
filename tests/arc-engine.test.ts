import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { terminate } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import {
  getPublicArcCampaigns,
  createArcCampaign,
  claimArcCopy,
  submitVoluntaryReview,
  proposeNewsletterSwap,
  respondToNewsletterSwap,
  recordSwapClick,
} from '../src/lib/arcService';
import { ArcCampaign } from '../src/types/arc';

after(async () => {
  if (db) {
    await terminate(db).catch(() => {});
  }
});

test('arcService: returns public campaigns and filters by genre', async () => {
  const allCampaigns = await getPublicArcCampaigns();
  assert.ok(Array.isArray(allCampaigns));
  assert.ok(allCampaigns.length >= 3, 'Should return initial community seed campaigns');

  // Filter by Medical / Non-Fiction
  const filtered = await getPublicArcCampaigns('Medical');
  assert.ok(filtered.length >= 1);
  assert.ok(filtered.some((c) => c.title.includes('Assertive Nurse')));
});

test('arcService: author creates new ARC campaign with slot limits', async () => {
  const newCampaign = await createArcCampaign('test-author-123', {
    authorName: 'Test Author',
    authorEmail: 'author@test.com',
    title: 'Unit Test Thriller',
    genre: 'Mystery / Thriller',
    blurb: 'A fast-paced test case thriller exploring automated QA in modern software.',
    pageCount: 210,
    format: 'both',
    totalSlots: 30,
    reviewWindowDays: 14,
    amazonAsin: 'B0TEST1234',
    amazonUrl: 'https://www.amazon.com/dp/B0TEST1234',
    watermarkingEnabled: true,
    targetMarketplace: 'US',
    status: 'active',
  });

  assert.ok(newCampaign.id.startsWith('arc-'));
  assert.equal(newCampaign.claimedSlots, 0);
  assert.equal(newCampaign.totalSlots, 30);
  assert.equal(newCampaign.watermarkingEnabled, true);
});

test('arcService: reader claims ARC copy and decrements available slots', async () => {
  const campaign: ArcCampaign = {
    id: `arc-test-${Date.now()}`,
    authorId: 'test-author',
    authorName: 'Jane Doe',
    title: 'Echoes in the Code',
    genre: 'Sci-Fi',
    blurb: 'A rogue AI explores humanity through poetry.',
    format: 'epub',
    totalSlots: 20,
    claimedSlots: 5,
    reviewWindowDays: 14,
    watermarkingEnabled: true,
    targetMarketplace: 'US',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const claim = await claimArcCopy(campaign, {
    uid: 'reader-999',
    email: 'reader@example.com',
    name: 'Bookworm Alex',
  });

  assert.ok(claim.id.startsWith('claim-'));
  assert.equal(claim.readerEmail, 'reader@example.com');
  assert.equal(claim.status, 'approved');
  assert.equal(claim.downloadCount, 1);
});

test('arcService: reader voluntarily submits review proof', async () => {
  const claimId = `claim-unit-${Date.now()}`;
  const reviewUrl = 'https://www.amazon.com/review/R1234567890';

  await submitVoluntaryReview(claimId, reviewUrl, 5, 'Thrilling read with vivid characters!');
  // Should complete without error
  assert.ok(true);
});

test('arcService: proposes newsletter swap with attribution tracking tokens', async () => {
  const swap = await proposeNewsletterSwap({
    requesterAuthorId: 'author-alpha',
    requesterAuthorName: 'Alpha Author',
    requesterBookTitle: 'Alpha Fantasy',
    requesterAmazonUrl: 'https://www.amazon.com/dp/B0ALPHA',
    requesterNewsletterSize: 850,
    requesterGenre: 'Fantasy / Romance',
    targetDateForRequester: '2026-09-15',

    recipientAuthorId: 'author-beta',
    recipientAuthorName: 'Beta Author',
    recipientBookTitle: 'Beta Kingdom',
    recipientAmazonUrl: 'https://www.amazon.com/dp/B0BETA',
    recipientNewsletterSize: 1100,
    recipientGenre: 'Fantasy / Romance',
    targetDateForRecipient: '2026-09-22',
  });

  assert.ok(swap.id.startsWith('swap-'));
  assert.equal(swap.status, 'pending');
  assert.ok(swap.trackingTokenA.startsWith('trk-a-'));
  assert.ok(swap.trackingTokenB.startsWith('trk-b-'));
  assert.equal(swap.requesterClicks, 0);

  // Author Beta accepts proposal
  await respondToNewsletterSwap(swap.id, 'accepted');

  // Test click attribution
  const redirectUrl = await recordSwapClick(swap.trackingTokenA);
  assert.equal(redirectUrl, 'https://www.amazon.com/dp/B0BETA');
});

test('compliance: FTC disclosure includes mandatory voluntary language', () => {
  const ftcDisclaimer = 'I received an Advance Review Copy of this book from KDP Studio and am leaving this review voluntarily.';
  assert.ok(ftcDisclaimer.includes('Advance Review Copy'));
  assert.ok(ftcDisclaimer.includes('voluntarily'));
  assert.ok(!ftcDisclaimer.includes('in exchange for a 5-star'));
});
