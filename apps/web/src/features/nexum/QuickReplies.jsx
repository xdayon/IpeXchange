export default function QuickReplies({ pills, busy, onPill }) {
  if (!pills.length || busy) return null;

  return (
    <div className="nexum-quick-replies">
      <span>Quick replies</span>
      <div className="nexum-pills-row">
        {pills.map((text, index) => (
          <button
            key={text + index}
            className="nexum-pill"
            style={{ animationDelay: `${index * 40}ms` }}
            onClick={() => onPill(text)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
