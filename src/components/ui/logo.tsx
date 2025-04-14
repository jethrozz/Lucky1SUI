import React from 'react';
import { Avatar } from "@radix-ui/themes";


const Logo: React.FC = () => {
  return (
    <Avatar
    size="4"
		src="https://img.picui.cn/free/2025/04/13/67fbd29ee3f30.png"
		fallback="A"
	/>
  );
};

export default Logo;
