import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "22px",
            left: "26px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#fde047",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "26px",
            right: "26px",
            width: "11px",
            height: "11px",
            borderRadius: "50%",
            background: "#ffffff",
          }}
        />
        <div
          style={{
            width: "108px",
            height: "108px",
            borderRadius: "50%",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "62px", fontWeight: 800, color: "#4f46e5" }}>P</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
