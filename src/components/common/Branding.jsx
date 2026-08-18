import { useState } from "react";
import { GraduationCap } from "lucide-react";


export const SCHOOL_NAME = "Godspower Field Academy";

export const SCHOOL_SHORT_NAME = "GFA CBT";

const LOGO_PATH = "/logo.png";

export function Logo({ size = 36, rounded = 10, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src={LOGO_PATH}
        alt={`${SCHOOL_NAME} logo`}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: rounded,
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Fallback placeholder icon — shown until a real logo.png is added.
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: "var(--navy, #1B3A6B)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <GraduationCap size={Math.round(size * 0.58)} color='#fff' />
    </div>
  );
}

export function SchoolName({ short = false, className = "", style }) {
  return (
    <span className={className} style={style}>
      {short ? SCHOOL_SHORT_NAME : SCHOOL_NAME}
    </span>
  );
}
