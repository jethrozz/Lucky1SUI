import React from 'react';
import { Avatar } from "@radix-ui/themes";

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <Avatar
    size="4"
		src="https://img.picui.cn/free/2025/04/13/67fbd29ee3f30.png"
		fallback="A"
	/>
  );
};

export default Logo;
