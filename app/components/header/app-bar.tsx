"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import TableViewIcon from "@mui/icons-material/TableView";
import { IconButton, Menu, MenuItem, ThemeProvider, createTheme } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { grey, orange } from "@mui/material/colors";
import Link from "next/link";
import * as React from "react";
import LogoSvgIcon from "./logo-icon";
import QQBtn from "./qq-btn";
import V2PricesSwitch from "./v2-prices-switch";

export default function HeaderAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const theme = createTheme({
    palette: {
      mode: "light",
      primary: {
        main: orange[300],
      },
      secondary: {
        main: grey[300],
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: "52px !important", maxHeight: "52px !important" }}>
            <Typography fontSize="3em" lineHeight="0" className="fill-black mr-2">
              <LogoSvgIcon />
            </Typography>

            <MuiLink href="/" variant="h6" underline="none" component={Link} noWrap className="mr-4 text-black">
              科伦巴商会
            </MuiLink>

            <V2PricesSwitch />

            <div className="grow" />

            {/* Desktop Nav Menu */}
            <Box className="grow-0 hidden sm:flex text-black">
              <Link href="/" className="ml-2">
                <Button variant="text" className="text-black px-0" startIcon={<TableViewIcon />}>
                  数据
                </Button>
              </Link>
              <Link href="/discussion" className="ml-2">
                <Button variant="text" className="text-black px-0" startIcon={<ChatBubbleOutlineRoundedIcon />}>
                  讨论
                </Button>
              </Link>
              <Link href="/about" className="ml-2">
                <Button variant="text" className="text-black px-0" startIcon={<InfoOutlinedIcon />}>
                  关于
                </Button>
              </Link>

              <QQBtn wrapperClassName="mx-2" buttonClassName="px-0" displayText={true} />
            </Box>

            {/* Mobile Nav Menu */}
            <Box className="grow-0 flex sm:hidden">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                className="block sm:hidden"
              >
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="/" className="mx-auto">
                    <Button variant="text" className="text-black" startIcon={<TableViewIcon />}>
                      数据
                    </Button>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="/discussion" className="mx-auto">
                    <Button variant="text" className="text-black" startIcon={<ChatBubbleOutlineRoundedIcon />}>
                      讨论
                    </Button>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="/about" className="mx-auto">
                    <Button variant="text" className="text-black" startIcon={<InfoOutlinedIcon />}>
                      关于
                    </Button>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseNavMenu}>
                  <QQBtn wrapperClassName="mx-auto" displayText={true} />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}
