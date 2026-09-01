/** Interior + typesetting engine tests */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSpineWidth, getMargins, estimatePageCount } from '../src/lib/kdp';
import { generateBookHtml } from '../src/lib/bookHtmlGenerator';
import type { Book, FormatterSettings, Margins, TrimDimensions } from '../src/types/index';
const baseSettings: FormatterSettings = {
 fontFamily: 'Garamond', fontSize: '11pt', lineSpacing: '1.5',
 paragraphIndent: '0.25in', dropCaps: true, trimSize: '6x9',
 paperType: 'white', pageNumberPosition: 'bottom-center',
 chapterStart: 'always-new-page', runningHeader: 'book-title',
 includedSections: { titlePage: true, copyrightPage: true, dedication: false, toc: true, preface: false, chapters: true, aboutAuthor: false },
};
const margins: Margins = { top:  0.5, bottom:  0.75, inside:  0.5, outside:  0.25 };
const trim: TrimDimensions = { width:  6, height:  9 };
function makeBook(): Book {
 return { id:'bk', title:'The Quiet Test', subtitle:'A Spec', author:'TA',
 language:'English', genre:'SciFi', trimSize:'6x9', paperType:'white',
 status:'formatting', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
 chapters:[ {id:'c1',title:'Chapter 1: The Signal',content:'<p>Start.</p><p>Mid.</p>',order:  1,wordCount:                                             120},{id:'c2',title:'Chapter 2: The Echo',content:'<p>Second.</p>',order:  2,wordCount:  85} ],
 frontMatter:{titlePage:true,copyrightPage:true,dedication:'' ,tableOfContents:true,preface:'' },
 backMatter:{aboutAuthor:'Bio',otherBooks:'' ,resources:'' },
 metadata:{description:'' ,keywords:[],categories:[],price:  14.99,royaltyPlan:'70'} };
}
function render(s: FormatterSettings): string { return generateBookHtml(makeBook(), s, margins, trim); }
test('cream ink weighs more than white', () =>{ assert.ok(getSpineWidth(100,'cream') > getSpineWidth(100,'white') ); });
test('gutter grows with page count', () =>{ const a=getMargins('6x9',100).inside; const b=getMargins('6x9',350).inside; const d=getMargins('6x9',700).inside; assert.ok(a<b)&&assert.ok(b<d)&&assert.ok(a>0); });
test('page count min', () =>{ assert.ok(estimatePageCount(10,'6x9','11pt') >=  24); });
test('bottom-center emits folio once in @bottom-center', () =>{ const h=render(baseSettings); assert.match(h,/@bottom-center/); assert.doesNotMatch(h,/@top-left|@top-right|@bottom-left|@bottom-right/); });
test('runningHeader none omits header', () =>{ const h=render({...baseSettings,runningHeader:'none'}); assert.doesNotMatch(h,/@top-center/); });
test('bottom-outer folios land outer edges', () =>{ const h=render({...baseSettings,pageNumberPosition:'bottom-outer'}); assert.match(h,/@bottom-left/); assert.match(h,/@bottom-right/); assert.doesNotMatch(h,/@bottom-center|@top-left|@top-right/); });
test('none omits folios', () =>{ const h=render({...baseSettings,pageNumberPosition:'none'}); assert.doesNotMatch(h,/counter\(page\)/); });
test('TOC uses placeholder not fabricated indices', () =>{ const h=render(baseSettings); assert.doesNotMatch(h,/<span class="toc-page-num">[0-9]+<\/span>/); assert.match(h,/<span class="toc-page-num">&mdash;<\/span>/); });
