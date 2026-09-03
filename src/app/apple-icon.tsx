import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const frontW = 83;
  const frontH = 108;
  const frontLeft = (180 - frontW) / 2;
  const frontTop = (180 - frontH) / 2;

  const midW = 79;
  const midH = 104;
  const midLeft = frontLeft - 9;
  const midTop = frontTop + 3;

  const backW = 76;
  const backH = 101;
  const backLeft = frontLeft - 18;
  const backTop = frontTop + 6;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(150deg, #000000 0%, #04161c 55%, #062a33 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${backLeft}px`,
            top: `${backTop}px`,
            width: `${backW}px`,
            height: `${backH}px`,
            borderRadius: "11px",
            background: "#071820",
            border: "1.5px solid rgba(34,211,238,0.35)",
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
            borderRadius: "12px",
            background: "#0a2129",
            border: "1.5px solid rgba(34,211,238,0.55)",
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
            borderRadius: "13px",
            background: "linear-gradient(160deg, #04141a 0%, #000000 100%)",
            border: "3px solid #22d3ee",
            boxShadow: "0 0 16px rgba(34,211,238,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "15px",
              left: "12px",
              width: "9px",
              height: "9px",
              borderRadius: "3px",
              background: "rgba(103,232,249,0.55)",
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "13px",
              right: "11px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#22d3ee",
            }}
          />
          <div style={{ fontSize: "54px", fontWeight: 800, color: "#e0fbff" }}>P</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
