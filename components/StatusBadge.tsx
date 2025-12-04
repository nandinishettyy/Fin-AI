export default function StatusBadge({ status }: { status: string }) {
  let bg = "";
  let text = "";

  if (status === "completed") {
    bg = "bg-green-100";
    text = "text-green-700";
  } else if (status === "pending") {
    bg = "bg-yellow-100";
    text = "text-yellow-700";
  } else {
    bg = "bg-gray-100";
    text = "text-gray-700";
  }

  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full ${bg} ${text}`}
    >
      {status}
    </span>
  );
}
