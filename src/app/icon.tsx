import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = await id;
  const size = iconId === "512" ? 512 : 192;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)",
          borderRadius: `${size * 0.22}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${size * 0.12}px`,
            left: `${size * 0.14}px`,
            width: `${size * 0.09}px`,
            height: `${size * 0.09}px`,
            borderRadius: "50%",
            background: "#fde047",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: `${size * 0.15}px`,
            right: `${size * 0.15}px`,
            width: `${size * 0.06}px`,
            height: `${size * 0.06}px`,
            borderRadius: "50%",
            background: "#ffffff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: `${size * 0.2}px`,
            right: `${size * 0.18}px`,
            width: `${size * 0.04}px`,
            height: `${size * 0.04}px`,
            borderRadius: "50%",
            background: "#ffffff",
          }}
        />
        <div
          style={{
            width: `${size * 0.6}px`,
            height: `${size * 0.6}px`,
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: `${size * 0.34}px`,
              fontWeight: 800,
              color: "#4f46e5",
            }}
          >
            P
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
