import Image from "next/image";

interface FatigueIconProps {
  className?: string;
  size?: number;
}

export default function FatigueIcon(props: FatigueIconProps) {
  const size = props.size ?? 24;

  return (
    <Image src="/commons-icons/fatigue.png" alt="fatigue" width={size} height={size} className={props.className} />
  );
}
