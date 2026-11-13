import { ImageResponse } from "next/og";

/**
 * The app's icon, drawn in code so the repo carries no binary assets: a soft ring around a green dot on the warm
 * dark of the ink colour. `192` and `512` are rounded squares for the "any" purpose; `maskable` is full-bleed with
 * everything inside the central 60%, so Android can crop it to a circle, a squircle or whatever its launcher uses.
 */
const ICONS = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  maskable: { size: 512, maskable: true },
} as const;

type IconName = keyof typeof ICONS;

export function generateStaticParams() {
  return (Object.keys(ICONS) as IconName[]).map((name) => ({ name }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const icon = ICONS[name as IconName];
  if (!icon) return new Response("Not found", { status: 404 });

  const { size, maskable } = icon;
  const ring = size * (maskable ? 0.46 : 0.56);
  const stroke = size * 0.045;
  const dot = size * (maskable ? 0.14 : 0.17);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a2622",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div
          style={{
            width: ring,
            height: ring,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: ring,
            border: `${stroke}px solid #f6f3ee`,
          }}
        >
          <div style={{ width: dot, height: dot, borderRadius: dot, background: "#7fb391" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
