export default function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}