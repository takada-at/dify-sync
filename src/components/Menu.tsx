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
      <Box
        borderStyle="round"
        borderColor="cyan"
        padding={1}
        flexDirection="column"
        width={60}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color="cyan">
            {title}
          </Text>
        </Box>

        <Box flexDirection="column" gap={1}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box
                key={option.value}
                paddingX={2}
                paddingY={1}
                borderStyle={isSelected ? 'bold' : 'single'}
                borderColor={isSelected ? 'magenta' : 'gray'}
                flexDirection="column"
              >
                <Box gap={1}>
                  <Text
                    color={isSelected ? 'magenta' : 'white'}
                    bold={isSelected}
                  >
                    {isSelected ? '▶' : ' '} {option.icon || '•'}{' '}
                    {option.label}
                  </Text>
                </Box>
                {option.description && (
                  <Box marginLeft={4} marginTop={0}>
                    <Text color={isSelected ? 'gray' : 'darkGray'} italic>
                      {option.description}
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="center">
        <Box borderStyle="round" borderColor="darkGray" paddingX={2}>
          <Text color="gray">
            <Text color="yellow">↑↓</Text> Navigate{' '}
            <Text color="yellow">↵</Text> Select <Text color="yellow">^C</Text>{' '}
            Exit
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
