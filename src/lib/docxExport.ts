import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
} from 'docx';
import { Book, FormatterSettings, Margins, TrimDimensions } from '../types/index';

/**
 * Generates and downloads a Microsoft Word (.docx) manuscript formatted with KDP dimensions
 */
export async function generateDocx(
  book: Book,
  settings: FormatterSettings,
  margins: Margins,
  trimDimensions: TrimDimensions
): Promise<Blob> {
  const font = settings.fontFamily || 'Garamond';
  // Convert pt to half-points for docx (11pt = 22)
  const fontPt = parseInt(settings.fontSize?.replace('pt', '') || '11', 10);
  const fontSizeHalfPoints = fontPt * 2;

  // Convert line spacing multiplier (1.15 -> 276, 1.5 -> 360, 2.0 -> 480)
  const lineSpacingNum = parseFloat(settings.lineSpacing || '1.5');
  const lineSpacingTwips = Math.round(lineSpacingNum * 240);

  // Indent in twips (1 inch = 1440 twips; 0.25in = 360 twips; 0.5in = 720 twips)
  const indentTwips =
    settings.paragraphIndent === '0.5in'
      ? 720
      : settings.paragraphIndent === '0.25in'
      ? 360
      : 0;

  const sectionsList: any[] = [];
  const childrenElements: any[] = [];

  // 1. Title Page
  if (settings.includedSections.titlePage) {
    childrenElements.push(
      new Paragraph({
        text: '',
        spacing: { before: 2880 }, // Spacing from top
      }),
      new Paragraph({
        text: book.title.toUpperCase(),
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        style: 'TitleStyle',
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: book.title.toUpperCase(),
            bold: true,
            size: fontSizeHalfPoints + 18,
            font: font,
          }),
        ],
      })
    );

    if (book.subtitle) {
      childrenElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1440 },
          children: [
            new TextRun({
              text: book.subtitle,
              italics: true,
              size: fontSizeHalfPoints + 4,
              font: font,
              color: '4B5563',
            }),
          ],
        })
      );
    }

    childrenElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 720 },
        children: [
          new TextRun({
            text: `BY ${book.author ? book.author.toUpperCase() : 'AUTHOR'}`,
            size: fontSizeHalfPoints + 2,
            bold: true,
            font: font,
          }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 2. Copyright
  if (settings.includedSections.copyright) {
    const year = new Date().getFullYear();
    childrenElements.push(
      new Paragraph({
        text: '',
        spacing: { before: 4000 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${book.title}\n`,
            bold: true,
            font: font,
            size: fontSizeHalfPoints - 4,
          }),
          new TextRun({
            text: `Copyright © ${year} ${book.author || 'Author'}. All rights reserved.\n\n`,
            font: font,
            size: fontSizeHalfPoints - 4,
          }),
          new TextRun({
            text: `No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without prior written permission.\n\n`,
            font: font,
            size: fontSizeHalfPoints - 4,
          }),
          new TextRun({
            text: `First Edition: ${year}\nPublished in the United States of America.`,
            font: font,
            size: fontSizeHalfPoints - 4,
          }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 3. Dedication
  if (settings.includedSections.dedication && book.frontMatter?.dedication) {
    childrenElements.push(
      new Paragraph({
        text: '',
        spacing: { before: 2880 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: book.frontMatter.dedication,
            italics: true,
            font: font,
            size: fontSizeHalfPoints + 2,
          }),
        ],
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 4. Table of Contents Placeholder
  if (settings.includedSections.toc && book.chapters.length > 0) {
    childrenElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 720 },
        children: [
          new TextRun({
            text: 'CONTENTS',
            bold: true,
            size: fontSizeHalfPoints + 10,
            font: font,
          }),
        ],
      })
    );

    book.chapters.forEach((c, idx) => {
      childrenElements.push(
        new Paragraph({
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: `${c.title || `Chapter ${idx + 1}`}`,
              font: font,
              size: fontSizeHalfPoints,
            }),
          ],
        })
      );
    });

    childrenElements.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 5. Preface
  if (settings.includedSections.preface && book.frontMatter?.preface) {
    childrenElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 720 },
        children: [
          new TextRun({
            text: 'PREFACE',
            bold: true,
            size: fontSizeHalfPoints + 10,
            font: font,
          }),
        ],
      })
    );

    const prefaceParagraphs = book.frontMatter.preface.split(/\n\s*\n/).filter(Boolean);
    prefaceParagraphs.forEach((p, idx) => {
      childrenElements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: idx === 0 ? undefined : { firstLine: indentTwips },
          spacing: { line: lineSpacingTwips, after: 120 },
          children: [
            new TextRun({
              text: p.replace(/<[^>]*>/g, '').trim(),
              font: font,
              size: fontSizeHalfPoints,
            }),
          ],
        })
      );
    });

    childrenElements.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 6. Chapters (or custom text)
  if (settings.includedSections.chapters) {
    if (settings.customText && settings.customText.trim()) {
      childrenElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1440, after: 720 },
          children: [
            new TextRun({
              text: (book.title || 'MANUSCRIPT').toUpperCase(),
              bold: true,
              size: fontSizeHalfPoints + 10,
              font: font,
            }),
          ],
        })
      );

      const customParas = settings.customText.split(/\n\s*\n/).filter(Boolean);
      customParas.forEach((p, pIdx) => {
        childrenElements.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: pIdx === 0 ? undefined : { firstLine: indentTwips },
            spacing: { line: lineSpacingTwips, after: 120 },
            children: [
              new TextRun({
                text: p.trim(),
                font: font,
                size: fontSizeHalfPoints,
              }),
            ],
          })
        );
      });
    } else if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chap, cIdx) => {
        if (cIdx > 0 && settings.chapterStart === 'always-new-page') {
          childrenElements.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }

        // Chapter Header
        childrenElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 180 },
            children: [
              new TextRun({
                text: `CHAPTER ${cIdx + 1}`,
                size: fontSizeHalfPoints - 2,
                color: '6B7280',
                font: font,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 720 },
            children: [
              new TextRun({
                text: chap.title || `Chapter ${cIdx + 1}`,
                bold: true,
                size: fontSizeHalfPoints + 8,
                font: font,
              }),
            ],
          })
        );

        // Strip HTML or split paragraphs
        const cleanContent = chap.content.replace(/<\/p>/gi, '\n\n').replace(/<[^>]*>/g, '');
        const paras = cleanContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

        paras.forEach((p, pIdx) => {
          childrenElements.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              indent: pIdx === 0 ? undefined : { firstLine: indentTwips },
              spacing: { line: lineSpacingTwips, after: 120 },
              children: [
                new TextRun({
                  text: p,
                  font: font,
                  size: fontSizeHalfPoints,
                }),
              ],
            })
          );
        });
      });
    }
  }

  // 7. About the Author
  if (settings.includedSections.aboutAuthor && book.backMatter?.aboutAuthor) {
    childrenElements.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 720 },
        children: [
          new TextRun({
            text: 'ABOUT THE AUTHOR',
            bold: true,
            size: fontSizeHalfPoints + 8,
            font: font,
          }),
        ],
      })
    );

    const authorParas = book.backMatter.aboutAuthor.split(/\n\s*\n/).filter(Boolean);
    authorParas.forEach((p, pIdx) => {
      childrenElements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: pIdx === 0 ? undefined : { firstLine: indentTwips },
          spacing: { line: lineSpacingTwips, after: 120 },
          children: [
            new TextRun({
              text: p.replace(/<[^>]*>/g, '').trim(),
              font: font,
              size: fontSizeHalfPoints,
            }),
          ],
        })
      );
    });
  }

  // Define docx document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(trimDimensions.width),
              height: convertInchesToTwip(trimDimensions.height),
            },
            margin: {
              top: convertInchesToTwip(margins.top),
              bottom: convertInchesToTwip(margins.bottom),
              left: convertInchesToTwip(margins.inside), // Gutter
              right: convertInchesToTwip(margins.outside),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text:
                      settings.runningHeader === 'book-title'
                        ? book.title.toUpperCase()
                        : '',
                    font: font,
                    size: fontSizeHalfPoints - 4,
                    color: '6B7280',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment:
                  settings.pageNumberPosition === 'bottom-outer'
                    ? AlignmentType.RIGHT
                    : AlignmentType.CENTER,
                children:
                  settings.pageNumberPosition !== 'none'
                    ? [
                        new TextRun({
                          children: [PageNumber.CURRENT],
                          font: font,
                          size: fontSizeHalfPoints - 4,
                        }),
                      ]
                    : [],
              }),
            ],
          }),
        },
        children: childrenElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
