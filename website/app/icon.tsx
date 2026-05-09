import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#E8F9FF",
          border: "18px solid #5AC8FA",
          borderRadius: "35%",
          color: "#003B73",
          display: "flex",
          fontFamily: "'Poppins', 'Open Sans', 'Segoe UI', sans-serif",
          fontSize: 160,
          fontWeight: 600,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -10,
          width: "100%"
        }}
      >
        🦉
      </div>
    ),
    {
      ...size
    }
  );
}
