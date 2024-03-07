import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
        <Link href="/discussion">
          <IconButton sx={{ padding: "6px" }}>
            <ChatBubbleOutlineRoundedIcon />
          </IconButton>
        </Link>
        <QQBtn />
        <Link href="/about">
          <IconButton sx={{ padding: "6px" }}>
            <InfoOutlinedIcon />
          </IconButton>
        </Link>
      </div>
    </header>
  );
}
