import { activeColoringGenerationProgress } from '../../generate/route';

export async function GET(
  req: Request,
  { params }: { params: { bookId: string } }
) {
  const bookId = params?.bookId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = () => {
        const progressData = activeColoringGenerationProgress.get(bookId);
        if (progressData) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
          );
          if (progressData.status === 'complete' || progressData.status === 'error') {
            return true;
          }
        }
        return false;
      };

      const interval = setInterval(() => {
        const isDone = sendUpdate();
        if (isDone) {
          clearInterval(interval);
          controller.close();
        }
      }, 500);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
