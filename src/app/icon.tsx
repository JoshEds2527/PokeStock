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

  const frontW = size * 0.46;
  const frontH = size * 0.6;
  const frontLeft = (size - frontW) / 2;
  const frontTop = (size - frontH) / 2;

  const midW = size * 0.44;
  const midH = size * 0.58;
  const midLeft = frontLeft - size * 0.05;
  const midTop = frontTop + size * 0.015;

  const backW = size * 0.42;
  const backH = size * 0.56;
  const backLeft = frontLeft - size * 0.1;
  const backTop = frontTop + size * 0.035;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(150deg, #000000 0%, #04161c 55%, #062a33 100%)",
          borderRadius: `${size * 0.22}px`,
          overflow: "hidden",
        }}
      >
        {/* Fanned card stack, back to front */}
        <div
          style={{
            position: "absolute",
            left: `${backLeft}px`,
            top: `${backTop}px`,
            width: `${backW}px`,
            height: `${backH}px`,
            borderRadius: `${size * 0.06}px`,
            background: "#071820",
            border: `${Math.max(1, size * 0.008)}px solid rgba(34,211,238,0.35)`,
            transform: "rotate(-22deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${midLeft}px`,
            top: `${midTop}px`,
            width: `${midW}px`,
            height: `${midH}px`,
            borderRadius: `${size * 0.065}px`,
            background: "#0a2129",
            border: `${Math.max(1, size * 0.008)}px solid rgba(34,211,238,0.55)`,
            transform: "rotate(-9deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${frontLeft}px`,
            top: `${frontTop}px`,
            width: `${frontW}px`,
            height: `${frontH}px`,
            borderRadius: `${size * 0.07}px`,
            background: "linear-gradient(160deg, #04141a 0%, #000000 100%)",
            border: `${Math.max(1, size * 0.016)}px solid #22d3ee`,
            boxShadow: `0 0 ${size * 0.09}px rgba(34,211,238,0.55)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: `${frontH * 0.14}px`,
              left: `${frontW * 0.14}px`,
              width: `${size * 0.05}px`,
              height: `${size * 0.05}px`,
              borderRadius: "3px",
              background: "rgba(103,232,249,0.55)",
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: `${frontH * 0.12}px`,
              right: `${frontW * 0.13}px`,
              width: `${size * 0.04}px`,
              height: `${size * 0.04}px`,
              borderRadius: "50%",
              background: "#22d3ee",
            }}
          />
          <div
            style={{
              fontSize: `${size * 0.3}px`,
              fontWeight: 800,
              color: "#e0fbff",
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
