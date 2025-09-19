// Presentational square component (not used directly; logic stays in Board)
export default function Square({ children, className, onClick }) {
  return <div className={className} onClick={onClick}>{children}</div>;
}
