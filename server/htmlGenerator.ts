export { generateBookHtml as buildBookHtml } from '../src/lib/bookHtmlGenerator';

// NOTE: thin re-export ?the client and server now share ONE typesetting generator (src/lib/bookHtmlGenerator.
// This removes the duplicate generated HTML (drift bug)and the fake TOC folio numbers.
