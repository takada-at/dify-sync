import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import {
  loadSettingsFromFile,
  saveSettingsToFile,
  getSettingsFilePath,
  Settings,
} from '../../repositories/settingsRepository.js';
import { loadConfig } from '../../repositories/config.js';

type SettingField = 'apiUrl' | 'apiKey' | 'datasetId' | 'saveButton';

export function SettingsScreen() {
  const [currentField, setCurrentField] = useState<SettingField>('apiUrl');
  const [settings, setSettings] = useState<Settings>({
    apiUrl: '',
    apiKey: '',
    datasetId: '',
  });
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try to load from settings file
        const fileSettings = await loadSettingsFromFile();
        if (fileSettings) {
          setSettings(fileSettings);
        } else {
          // If no settings file, try to load from current config
          try {
            const config = await loadConfig();
            setSettings({
              apiUrl: config.apiUrl,
              apiKey: config.apiKey,
              datasetId: config.datasetId,
            });
          } catch {
            // If config fails, use defaults
            setSettings({
              apiUrl: 'https://api.dify.ai/v1',
              apiKey: '',
              datasetId: '',
            });
          }
        }
      } catch (err) {
        setError(`Failed to load settings: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      // ESC handled by parent
      return;
    }

    if (key.upArrow) {
      const fields: SettingField[] = [
        'apiUrl',
        'apiKey',
        'datasetId',
        'saveButton',
      ];
      const currentIndex = fields.indexOf(currentField);
      if (currentIndex > 0) {
        setCurrentField(fields[currentIndex - 1]);
      }
    } else if (key.downArrow || key.tab) {
      const fields: SettingField[] = [
        'apiUrl',
        'apiKey',
        'datasetId',
        'saveButton',
      ];
      const currentIndex = fields.indexOf(currentField);
      if (currentIndex < fields.length - 1) {
        setCurrentField(fields[currentIndex + 1]);
      }
    } else if (key.ctrl && input === 's') {
      // Ctrl+S to save
      handleSave();
    } else if (key.return && currentField === 'saveButton') {
      // Enter on save button
      handleSave();
    }
  });

  const handleSave = async () => {
    try {
      await saveSettingsToFile(settings);
      setSavedMessage('Settings saved successfully!');
      setError('');

      // Clear message after 3 seconds
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setError(`Failed to save: ${err}`);
      setSavedMessage('');
    }
  };

  const handleFieldChange = (
    field: Exclude<SettingField, 'saveButton'>,
    value: string
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSavedMessage(''); // Clear saved message when editing
  };

  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Text color="gray">Loading settings...</Text>
      </Box>
    );
  }

  const renderField = (
    field: Exclude<SettingField, 'saveButton'>,
    label: string,
    placeholder: string,
    hideValue = false
  ) => {
    const isActive = currentField === field;
    const value = settings[field] || '';

    return (
      <Box key={field} marginBottom={1}>
        <Box width={20}>
          <Text color={isActive ? 'cyan' : 'white'} bold={isActive}>
            {isActive ? '▶ ' : '  '}
            {label}:
          </Text>
        </Box>
        <Box marginLeft={1}>
          {isActive ? (
            <TextInput
              value={value}
              placeholder={placeholder}
              onChange={val => handleFieldChange(field, val)}
              mask={hideValue ? '*' : undefined}
            />
          ) : (
            <Text color="gray">
              {hideValue && value
                ? '•'.repeat(value.length)
                : value || placeholder}
            </Text>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Settings Configuration
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray" dimColor>
          Config file: {getSettingsFilePath()}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {renderField('apiUrl', 'API URL', 'https://api.dify.ai/v1')}
        {renderField('apiKey', 'API Key', 'Enter your API key', true)}
        {renderField('datasetId', 'Dataset ID', 'Enter dataset ID')}

        <Box key="saveButton" marginTop={1}>
          <Box width={20}>
            <Text
              color={currentField === 'saveButton' ? 'cyan' : 'white'}
              bold={currentField === 'saveButton'}
            >
              {currentField === 'saveButton' ? '▶ ' : '  '}
            </Text>
          </Box>
          <Box marginLeft={1}>
            <Text
              color={currentField === 'saveButton' ? 'green' : 'white'}
              bold={currentField === 'saveButton'}
              backgroundColor={
                currentField === 'saveButton' ? 'green' : undefined
              }
            >
              {currentField === 'saveButton'
                ? ' Save Settings '
                : 'Save Settings'}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1} marginBottom={1}>
        <Text color="gray">
          <Text color="yellow">↑↓</Text> Navigate •{' '}
          <Text color="yellow">Tab</Text> Next field •{' '}
          <Text color="yellow">Enter</Text> Select •{' '}
          <Text color="yellow">Ctrl+S</Text> Save •{' '}
          <Text color="yellow">Esc</Text> Back
        </Text>
      </Box>

      {savedMessage && (
        <Box marginTop={1}>
          <Text color="green" bold>
            ✓ {savedMessage}
          </Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Priority: CLI args {'>'} Environment variables {'>'} Settings file
        </Text>
      </Box>
    </Box>
  );
}
