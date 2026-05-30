export default function VideoPreview(props: { videoUrl?: string; imageUrls: string[] }) {
  if (props.videoUrl) {
    return (
      <video
        src={props.videoUrl}
        controls
        playsInline
        className="aspect-video w-full rounded-lg border border-neutral-800 bg-black"
      />
    );
  }

  const images = props.imageUrls.slice(0, 3);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-800 bg-black">
      {images.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            animation: `adstudioFade 30s infinite`,
            animationDelay: `${idx * 10}s`,
            opacity: 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
      <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-2 text-xs text-neutral-200">
        Preview slideshow (mock video)
      </div>
    </div>
  );
}

