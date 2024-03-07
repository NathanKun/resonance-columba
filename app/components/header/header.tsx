import InfoIcon from "@mui/icons-material/Info";
import IconButton from "@mui/material/IconButton/IconButton";
import Link from "next/link";
import QQBtn from "./qqBtn";

export default function Header() {
  return (
    <header className="flex items-center justify-between w-full p-2">
      <h1 className="text-3xl font-medium">
        <Link href="/">科伦巴商会</Link>
      </h1>
      <div>
        <QQBtn />
        <Link href="/about">
          <IconButton sx={{ padding: "6px" }}>
            <InfoIcon />
          </IconButton>
        </Link>
      </div>
    </header>
  );
}
