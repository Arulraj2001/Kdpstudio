/**
 * Gemini AI Client Utility for Book Studio
 * Communicates with the secure backend Express endpoint at /api/gemini
 */

export async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        prompt,
        systemInstruction: systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate response');
    }

    return data.text || '';
  } catch (error: any) {
    console.error('callGemini failed:', error);
    throw error;
  }
}

export async function streamGemini(
  prompt: string,
  systemPrompt?: string,
  onChunk?: (text: string) => void,
  onComplete?: () => void,
  onError?: (err: Error) => void
): Promise<void> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'stream',
        prompt,
        systemInstruction: systemPrompt,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream connection failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('data: ')) {
          try {
            const data = JSON.parse(cleanLine.substring(6));
            if (data.text && onChunk) {
              onChunk(data.text);
            }
            if (data.done && onComplete) {
              onComplete();
            }
            if (data.error && onError) {
              onError(new Error(data.error));
            }
          } catch (e) {
            console.error('Failed to parse SSE line', cleanLine);
          }
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err: any) {
    console.error('streamGemini error:', err);
    if (onError) onError(err);
    else throw err;
  }
}

export async function generateTitleIdeas(
  genre: string,
  description: string
): Promise<Array<{ title: string; subtitle: string }>> {
  try {
    const prompt = `You are a bestselling author and Amazon KDP publishing expert.
Generate 5 high-converting, catchy book title and subtitle combinations for a ${genre} book.
Book description/concept: "${description || 'An engaging narrative designed for modern readers'}"

Format your response strictly as 5 numbered lines, each with the format:
1. Title: Subtitle
2. Title: Subtitle
3. Title: Subtitle
4. Title: Subtitle
5. Title: Subtitle

Only output the 5 title pairs without extra commentary.`;

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'title_ideas',
        prompt,
      }),
    });

    const data = await response.json();
    if (data.titles && Array.isArray(data.titles)) {
      return data.titles;
    }

    return [
      { title: 'The Unwritten Path', subtitle: 'Navigating Mastery and Clarity' },
      { title: 'Echoes of Tomorrow', subtitle: 'A Comprehensive Exploration' },
      { title: 'The Silent Catalyst', subtitle: 'Transforming Potential into Purpose' },
      { title: 'Beyond the Blueprint', subtitle: 'Secrets of Enduring Craft' },
      { title: 'The Modern Artisan', subtitle: 'Practical Principles for Peak Flow' },
    ];
  } catch (e) {
    console.error('Error generating title ideas:', e);
    return [
      { title: 'The Unwritten Path', subtitle: 'Navigating Mastery and Clarity' },
      { title: 'Echoes of Tomorrow', subtitle: 'A Comprehensive Exploration' },
      { title: 'The Silent Catalyst', subtitle: 'Transforming Potential into Purpose' },
      { title: 'Beyond the Blueprint', subtitle: 'Secrets of Enduring Craft' },
      { title: 'The Modern Artisan', subtitle: 'Practical Principles for Peak Flow' },
    ];
  }
}

export async function improveText(
  selectedText: string,
  instructionType: 'shorter' | 'longer' | 'grammar' | 'tone' | 'simplify',
  customTone?: string
): Promise<string> {
  const instructions = {
    shorter: 'Make this text more concise and punchy while retaining all key points.',
    longer: 'Expand this text with vivid descriptions, rich examples, and depth.',
    grammar: 'Fix any grammatical, punctuation, or spelling errors, making it publication-ready.',
    tone: `Rewrite this text in a ${customTone || 'engaging, polished'} tone suitable for a bestselling book.`,
    simplify: 'Simplify the language, using clear phrasing that is accessible and compelling.',
  };

  const prompt = `${instructions[instructionType]}
Original Text:
"${selectedText}"

Return ONLY the improved text, with no introductory phrases or quotation marks.`;

  return await callGemini(prompt, 'You are an elite developmental book editor specializing in Amazon KDP publications.');
}
