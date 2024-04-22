import { ROLE_RESONANCE_SKILLS } from "@/data/RoleResonanceSkills";
import { PlayerConfig } from "@/interfaces/player-config";
import { ResonanceSkill } from "@/interfaces/role-skill";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  Avatar,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Image from "next/image";

interface RoleSkillSelectsProps {
  playerConfig: PlayerConfig;
  setRoleResonance: (role: string, resonance: number) => void;
}

export default function RoleSkillSelects(props: RoleSkillSelectsProps) {
  const { playerConfig, setRoleResonance } = props;
  const { roles: playerRoles } = playerConfig;

  const handleResonanceLevelClick = (role: string, resonance: number) => {
    setRoleResonance(role, resonance);
  };

  const renderSkillText = (roleSkill: ResonanceSkill) => {
    const texts: any = [];

    const pdtSkill = roleSkill.buyMore.product;
    if (pdtSkill) {
      Object.entries(pdtSkill).map(([pdt, percent]) => {
        texts.push(
          <span key={`roleskilltext-pdt-${pdt}`} className="mx-auto block text-center pt-1 max-sm:min-w-24">
            {pdt}+{percent}%
          </span>,
        );
      });
    }

    const citySkill = roleSkill.buyMore.city;
    if (citySkill) {
      Object.entries(citySkill).map(([city, percent]) => {
        texts.push(
          <span key={`roleskilltext-city-${city}`} className="mx-auto block text-center pt-1 max-sm:min-w-24">
            {city}特产+{percent}%
          </span>,
        );
      });
    }

    return texts;
  };

  // table of role skills per resonance level
  return (
    <Box>
      <TableContainer className="w-full bg-white dark:bg-gray-800 max-w-6xl mx-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">乘员</TableCell>
              {[0, 1, 4, 5].map((resonance) => (
                <TableCell key={`resonance-${resonance}`} align="center">
                  共振{resonance}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(ROLE_RESONANCE_SKILLS).map(([role, resonanceSkills]) => (
              <TableRow key={`role-${role}`}>
                <TableCell scope="row" className="max-sm:p-1">
                  <Avatar>
                    <Image src={`/roles/head/${role}.png`} alt={role} width={40} height={40} />
                  </Avatar>
                  <span className="mx-auto block text-center pt-2">{role}</span>
                </TableCell>
                <TableCell scope="row" className="max-sm:p-1">
                  <Button
                    startIcon={(playerRoles?.[role]?.resonance ?? 0) === 0 ? <CheckBoxIcon /> : null}
                    onClick={() => handleResonanceLevelClick(role, 0)}
                    className="h-16"
                  >
                    无
                  </Button>
                </TableCell>

                {[1, 4, 5].map((resonanceLevel) => {
                  const key = `resonance-${role}-${resonanceLevel}`;
                  const roleSkills = resonanceSkills[resonanceLevel];
                  if (!roleSkills) {
                    return <TableCell key={key} align="center" className="max-sm:p-1"></TableCell>;
                  }

                  return (
                    <TableCell key={key} align="center" className="max-sm:p-1">
                      <Button
                        startIcon={(playerRoles?.[role]?.resonance ?? 0) === resonanceLevel ? <CheckBoxIcon /> : null}
                        onClick={() => handleResonanceLevelClick(role, resonanceLevel)}
                        className="h-16"
                      >
                        <Box className="flex-col">{renderSkillText(roleSkills)}</Box>
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
