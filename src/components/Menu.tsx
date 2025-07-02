import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

interface MenuProps {
  title: string;
  options: MenuOption[];
  onSelect: (value: string) => void;
}

export function Menu({ title, options, onSelect }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      onSelect(options[selectedIndex].value);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      <Box flexDirection="column">
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={option.value} paddingLeft={1}>
              <Text color={isSelected ? 'magenta' : 'white'} bold={isSelected}>
                {isSelected ? '❯' : ' '} {option.icon} {option.label}
              </Text>
              {isSelected && option.description && (
                <Text color="gray" dimColor>
                  {' '}
                  ({option.description})
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor color="gray">
          ↑↓ Navigate • ↵ Select • ^C Exit
        </Text>
      </Box>
    </Box>
  );
}
