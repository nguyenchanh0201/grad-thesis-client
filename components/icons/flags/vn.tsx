import { useId, SVGProps } from "react";

export function VNFlag(props: SVGProps<SVGSVGElement>) {
  const id = useId();
  const clipId = `clip_vn_${id.replace(/:/g, "")}`;

  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"
          fill="#DA251D"
        />
        <polygon
          points="10,4.5 11.29,8.22 15.23,8.3 12.09,10.68 13.23,14.45 10,12.2 6.77,14.45 7.91,10.68 4.77,8.3 8.71,8.22"
          fill="#FFCD00"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
