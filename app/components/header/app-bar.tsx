"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
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
import { useState } from "react";
import LogoSvgIcon from "./logo-icon";
import QQBtn from "./qq-btn";
import V2PricesSwitch from "./v2-prices-switch";

export default function HeaderAppBar() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
    console.log(event.currentTarget);
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

            <Box className="grow" />

            {/* Desktop Nav Menu */}
            <Box className="grow-0 hidden min-[835px]:flex text-black">
              <Link href="/" className="ml-2">
                <Button variant="text" className="text-black px-0" startIcon={<TableViewIcon />}>
                  数据
                </Button>
              </Link>
              <Link href="/route" className="ml-2">
                <Button variant="text" className="text-black px-0" startIcon={<RouteOutlinedIcon />}>
                  路线
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

              <Link href="https://soli-reso.com/" className="ml-2" target="_blank">
                <Button variant="outlined" className="text-black" color="error">
                  雷索纳斯官网
                </Button>
              </Link>
            </Box>

            {/* Mobile Nav Menu */}
            <Box className="grow-0 flex min-[835px]:hidden">
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
                className="block"
              >
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="/" className="mx-auto">
                    <Button variant="text" className="text-black" startIcon={<TableViewIcon />}>
                      数据
                    </Button>
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="/route" className="mx-auto">
                    <Button variant="text" className="text-black" startIcon={<RouteOutlinedIcon />}>
                      路线
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
                <MenuItem onClick={handleCloseNavMenu}>
                  <Link href="https://soli-reso.com/" className="mx-auto" target="_blank">
                    <Button variant="outlined" className="text-black" color="error">
                      雷索纳斯官网
                    </Button>
                  </Link>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}
