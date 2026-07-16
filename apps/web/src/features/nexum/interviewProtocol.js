const PILLS_RE = /<<\s*PILLS\s*:([^>]*)>>/i;
const PROGRESS_RE = /<<\s*PROGRESS\s*:\s*interests=(\d+)\s*\|\s*offers=(\d+)\s*\|\s*detailed=(\d+)\s*>>/i;

export function parseInterviewReply(fullText) {
  const text = String(fullText ?? '');
  const pillsMatch = text.match(PILLS_RE);
  const progressMatch = text.match(PROGRESS_RE);

  return {
    content: text.split('<<')[0].trim(),
    ready: /<<\s*READY\s*>>/i.test(text),
    pills: pillsMatch
      ? pillsMatch[1].split('|').map((item) => item.trim()).filter(Boolean)
          .slice(0, 4).map((item) => item.slice(0, 40))
      : [],
    progress: progressMatch ? {
      interests: Number(progressMatch[1]),
      offers: Number(progressMatch[2]),
      detailed: Number(progressMatch[3]),
    } : null,
  };
}
