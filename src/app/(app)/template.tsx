// A template remounts on navigation between sections (hoje, semana, metas, refletir), unlike the layout, so
// each arrival replays the page's entrance. Moving within a section (/metas -> /metas/<id>) does not.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
