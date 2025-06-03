// frontend/src/utils/urlHelpers.ts

export const getVideoDetailsFromUrl = (url: string) => {
  let videoId = null;
  let platform = null;
  let embedUrl = null;
  let thumbnailUrl = null;

  // YouTube standard watch URL & short URL
  const youtubeWatchRegex =
    /(?:http|https):\/\/(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
  const youtubeMatch = url.match(youtubeWatchRegex);

  if (youtubeMatch && youtubeMatch[1]) {
    videoId = youtubeMatch[1];
    platform = "youtube";
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`; // High quality thumbnail
    // Fallback if maxresdefault isn't available: https://img.youtube.com/vi/${videoId}/hqdefault.jpg
  }

  // Vimeo URL: https://vimeo.com/VIDEO_ID
  const vimeoRegex =
    /(?:http|https):\/\/(?:www\.)?vimeo\.com\/(?:channels\/\w+\/)?(\d+)(?:\S+)?/i;
  const vimeoMatch = url.match(vimeoRegex);

  if (vimeoMatch && vimeoMatch[1]) {
    videoId = vimeoMatch[1];
    platform = "vimeo";
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
    // Vimeo thumbnails often need a separate API call or vumbnail.com helper for direct links
    thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`; // Using vumbnail.com for simplicity
  }

  return { videoId, platform, embedUrl, thumbnailUrl };
};
