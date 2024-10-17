import Image from "next/image";
import iconSrc from "/public/commons-icons/fatigue.png";

interface FatigueIconProps {
  className?: string;
  size?: number;
}

export default function FatigueIcon(props: FatigueIconProps) {
  const size = props.size ?? 24;

  return <Image src={iconSrc} alt="fatigue" width={size} height={size} className={props.className} />;
}
