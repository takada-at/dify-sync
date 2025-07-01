import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuOption {
  label: string;
  value: string;
}

interface MenuProps {
  title: string;
  options: MenuOption[];
  onSelect: (value: string) => void;
}

export function Menu({ title, options, onSelect }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(options[selectedIndex].value);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {options.map((option, index) => (
        <Box key={option.value} marginLeft={2}>
          <Text color={index === selectedIndex ? 'green' : 'white'}>
            {index === selectedIndex ? '→ ' : '  '}
            {option.label}
          </Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="gray">Use ↑↓ arrows to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
}
