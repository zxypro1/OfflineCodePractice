import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  TextInput,
  Textarea,
  Select,
  FileInput,
  Stack,
  Grid,
  ActionIcon,
  Text,
  Alert,
  Box,
  Divider
} from '@mantine/core';
import { IconTrash, IconPlus, IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from '../contexts/I18nContext';

interface ProblemFormData {
  id: string;
  title: {
    en: string;
    zh: string;
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: {
    en: string;
    zh: string;
  };
  examples: Array<{
    input: string;
    output: string;
  }>;
  template: {
    js?: string;
    python?: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
  solution?: {
    js?: string;
    python?: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
  tests: Array<{
    input: string;
    output: string;
  }>;
}

interface ProblemFormProps {
  mode?: 'add' | 'edit';
  initialData?: ProblemFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

const defaultFormData: ProblemFormData = {
  id: '',
  title: { en: '', zh: '' },
  difficulty: 'Easy',
  tags: [],
  description: { en: '', zh: '' },
  examples: [{ input: '', output: '' }],
  template: {
    js: 'function solution() {\n  // write your code here\n}\nmodule.exports = solution;',
    python: 'def solution():\n    # write your code here\n    pass',
    java: 'public class Solution {\n    public void solution() {\n        // write your code here\n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {\n        // write your code here\n    }\n};',
    c: '#include <stdio.h>\n\nvoid solution() {\n    // write your code here\n}'
  },
  solution: {},
  tests: [{ input: '', output: '' }]
};

const ProblemForm: React.FC<ProblemFormProps> = ({ 
  mode = 'add', 
  initialData, 
  onSuccess,
  onCancel,
  compact = false
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importMode, setImportMode] = useState<'form' | 'json'>('form');
  const [jsonInput, setJsonInput] = useState('');
  const [originalId, setOriginalId] = useState<string>('');

  const [formData, setFormData] = useState<ProblemFormData>(defaultFormData);

  // Initialize form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        // Ensure nested objects are properly merged
        title: { ...defaultFormData.title, ...initialData.title },
        description: { ...defaultFormData.description, ...initialData.description },
        template: { ...defaultFormData.template, ...initialData.template },
        solution: { ...defaultFormData.solution, ...initialData.solution },
        examples: initialData.examples?.length ? initialData.examples : defaultFormData.examples,
        tests: initialData.tests?.length ? initialData.tests : defaultFormData.tests,
        tags: initialData.tags || []
      });
      setOriginalId(initialData.id);
    } else {
      setFormData(defaultFormData);
      setOriginalId('');
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof ProblemFormData] as any,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field: 'examples' | 'tests', index: number, subField: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  const addArrayItem = (field: 'examples' | 'tests') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { input: '', output: '' }]
    }));
  };

  const removeArrayItem = (field: 'examples' | 'tests', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    handleInputChange('tags', tags);
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validate the imported JSON structure
      if (!parsed.id || !parsed.title || !parsed.difficulty) {
        throw new Error('Invalid JSON structure');
      }
      
      setFormData(parsed);
      setImportMode('form');
      setMessage({ type: 'success', text: t('addProblem.jsonImportedSuccess') });
    } catch (error) {
      setMessage({ type: 'error', text: t('addProblem.invalidJsonFormat') });
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setOriginalId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const isEdit = mode === 'edit';
      const apiUrl = isEdit ? '/api/update-problem' : '/api/add-problem';
      const body = isEdit 
        ? { problem: formData, originalId } 
        : { problem: formData };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = isEdit 
          ? t('addProblem.problemUpdatedSuccess', { id: formData.id })
          : t('addProblem.problemAddedSuccess', { id: formData.id });
        setMessage({ type: 'success', text: successMessage });
        
        if (!isEdit) {
          // Reset form only when adding new problem
          resetForm();
        }
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: result.error || t('common.error') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('addProblem.networkError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = mode === 'edit';

  return (
    <Container size={compact ? "lg" : "xl"} p={compact ? 0 : undefined}>
      {!compact && (
        <Title order={1} mb="xl">
          {isEditMode ? t('addProblem.editTitle') : t('addProblem.title')}
        </Title>
      )}
      
      {/* Mode Toggle - only show for add mode */}
      {!isEditMode && !compact && (
        <Paper p="md" mb="xl">
          <Group gap="md">
            <Button
              variant={importMode === 'form' ? 'filled' : 'outline'}
              onClick={() => setImportMode('form')}
            >
              {t('addProblem.manualForm')}
            </Button>
            <Button
              variant={importMode === 'json' ? 'filled' : 'outline'}
              onClick={() => setImportMode('json')}
            >
              {t('addProblem.importJson')}
            </Button>
          </Group>
        </Paper>
      )}

      {/* JSON Import Mode */}
      {importMode === 'json' && !isEditMode && (
        <Paper p="md" mb="xl" withBorder>
          <Title order={2} size="h3" mb="md">{t('addProblem.importJson')}</Title>
          
          <Stack gap="md">
            {/* File Upload */}
            <FileInput
              label={t('addProblem.uploadJsonFile')}
              placeholder={t('addProblem.selectJsonFile')}
              accept=".json"
              leftSection={<IconUpload size={16} />}
              onChange={(file) => {
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result as string;
                    setJsonInput(content);
                  };
                  reader.readAsText(file);
                }
              }}
            />

            {/* JSON Text Input */}
            <Textarea
              label={t('addProblem.pasteJson')}
              placeholder={t('addProblem.pasteJson')}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              styles={{
                input: {
                  fontFamily: 'monospace',
                }
              }}
            />

            <Button
              onClick={handleJsonImport}
              color="green"
              leftSection={<IconCheck size={16} />}
            >
              {t('addProblem.importJsonButton')}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Form Mode */}
      {(importMode === 'form' || isEditMode) && (
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            {/* Basic Information */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.basicInformation')}</Title>
              <Grid align="flex-end">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label={t('addProblem.problemId')}
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="e.g., two-sum"
                    required
                    description={t('addProblem.problemIdHint')}
                    disabled={isEditMode}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label={t('addProblem.difficulty')}
                    value={formData.difficulty}
                    onChange={(value) => handleInputChange('difficulty', value)}
                    data={[
                      { value: 'Easy', label: t('homepage.difficulty.Easy') },
                      { value: 'Medium', label: t('homepage.difficulty.Medium') },
                      { value: 'Hard', label: t('homepage.difficulty.Hard') }
                    ]}
                    required
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Titles */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.titles')}</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label={t('addProblem.englishTitle')}
                    value={formData.title.en}
                    onChange={(e) => handleNestedChange('title', 'en', e.target.value)}
                    required
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label={t('addProblem.chineseTitle')}
                    value={formData.title.zh}
                    onChange={(e) => handleNestedChange('title', 'zh', e.target.value)}
                    required
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tags */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.tagsLabel').replace(':', '')}</Title>
              <TextInput
                label={t('addProblem.tagsLabel')}
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder={t('addProblem.tagsPlaceholder')}
              />
            </Paper>

            {/* Examples */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.examples')}</Title>
              <Stack gap="md">
                {formData.examples.map((example, index) => (
                  <Paper key={index} p="md" withBorder>
                    <Grid align="flex-end" gutter="md">
                      <Grid.Col span={{ base: 12, xs: formData.examples.length > 1 ? 5 : 6, sm: formData.examples.length > 1 ? 5 : 6 }}>
                        <Textarea
                          label={t('addProblem.exampleInput')}
                          value={example.input}
                          onChange={(e) => handleArrayChange('examples', index, 'input', e.target.value)}
                          placeholder="e.g., nums = [2,7,11,15], target = 9"
                          rows={2}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: formData.examples.length > 1 ? 5 : 6, sm: formData.examples.length > 1 ? 5 : 6 }}>
                        <Textarea
                          label={t('addProblem.exampleOutput')}
                          value={example.output}
                          onChange={(e) => handleArrayChange('examples', index, 'output', e.target.value)}
                          placeholder="e.g., [0,1]"
                          rows={2}
                        />
                      </Grid.Col>
                      {formData.examples.length > 1 && (
                        <Grid.Col span={{ base: 12, xs: 2, sm: 2 }}>
                          <Group justify="center">
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => removeArrayItem('examples', index)}
                              size="lg"
                              aria-label={t('addProblem.removeExample')}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Grid.Col>
                      )}
                    </Grid>
                  </Paper>
                ))}
                <Button
                  variant="outline"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => addArrayItem('examples')}
                >
                  {t('addProblem.addExample')}
                </Button>
              </Stack>
            </Paper>

            {/* Descriptions */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.descriptions')}</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Textarea
                    label={t('addProblem.englishDescription')}
                    value={formData.description.en}
                    onChange={(e) => handleNestedChange('description', 'en', e.target.value)}
                    rows={4}
                    required
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Textarea
                    label={t('addProblem.chineseDescription')}
                    value={formData.description.zh}
                    onChange={(e) => handleNestedChange('description', 'zh', e.target.value)}
                    rows={4}
                    required
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Code Templates */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.codeTemplates')}</Title>
              <Text size="sm" c="dimmed" mb="md">{t('addProblem.codeTemplatesHint')}</Text>
              <Stack gap="md">
                <Textarea
                  label="JavaScript"
                  value={formData.template.js || ''}
                  onChange={(e) => handleNestedChange('template', 'js', e.target.value)}
                  rows={5}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder="function solution() {\n  // write your code here\n}\nmodule.exports = solution;"
                />
                <Textarea
                  label="Python"
                  value={formData.template.python || ''}
                  onChange={(e) => handleNestedChange('template', 'python', e.target.value)}
                  rows={5}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder="def solution():\n    # write your code here\n    pass"
                />
                <Textarea
                  label="Java"
                  value={formData.template.java || ''}
                  onChange={(e) => handleNestedChange('template', 'java', e.target.value)}
                  rows={6}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder="public class Solution {\n    public void solution() {\n        // write your code here\n    }\n}"
                />
                <Textarea
                  label="C++"
                  value={formData.template.cpp || ''}
                  onChange={(e) => handleNestedChange('template', 'cpp', e.target.value)}
                  rows={6}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder="#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {\n        // write your code here\n    }\n};"
                />
                <Textarea
                  label="C"
                  value={formData.template.c || ''}
                  onChange={(e) => handleNestedChange('template', 'c', e.target.value)}
                  rows={5}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder="#include <stdio.h>\n\nvoid solution() {\n    // write your code here\n}"
                />
              </Stack>
            </Paper>

            {/* Solution Templates (Optional) */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.solutionTemplates')}</Title>
              <Text size="sm" c="dimmed" mb="md">{t('addProblem.solutionTemplatesHint')}</Text>
              <Stack gap="md">
                <Textarea
                  label="JavaScript Solution"
                  value={formData.solution?.js || ''}
                  onChange={(e) => handleNestedChange('solution', 'js', e.target.value)}
                  rows={6}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder={t('addProblem.optionalSolutionPlaceholder')}
                />
                <Textarea
                  label="Python Solution"
                  value={formData.solution?.python || ''}
                  onChange={(e) => handleNestedChange('solution', 'python', e.target.value)}
                  rows={6}
                  styles={{ input: { fontFamily: 'monospace' } }}
                  placeholder={t('addProblem.optionalSolutionPlaceholder')}
                />
              </Stack>
            </Paper>

            {/* Test Cases */}
            <Paper p="lg" withBorder>
              <Title order={3} mb="md">{t('addProblem.testCases')}</Title>
              <Stack gap="md">
                {formData.tests.map((test, index) => (
                  <Paper key={index} p="md" withBorder>
                    <Grid align="flex-end" gutter="md">
                      <Grid.Col span={{ base: 12, xs: formData.tests.length > 1 ? 5 : 6, sm: formData.tests.length > 1 ? 5 : 6 }}>
                        <TextInput
                          label={t('addProblem.input')}
                          value={test.input}
                          onChange={(e) => handleArrayChange('tests', index, 'input', e.target.value)}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: formData.tests.length > 1 ? 5 : 6, sm: formData.tests.length > 1 ? 5 : 6 }}>
                        <TextInput
                          label={t('addProblem.expectedOutput')}
                          value={test.output}
                          onChange={(e) => handleArrayChange('tests', index, 'output', e.target.value)}
                          required
                        />
                      </Grid.Col>
                      {formData.tests.length > 1 && (
                        <Grid.Col span={{ base: 12, xs: 2, sm: 2 }}>
                          <Group justify="center">
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => removeArrayItem('tests', index)}
                              size="lg"
                              aria-label={t('addProblem.removeTestCase')}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Grid.Col>
                      )}
                    </Grid>
                  </Paper>
                ))}
                <Button
                  variant="outline"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => addArrayItem('tests')}
                >
                  {t('addProblem.addTestCase')}
                </Button>
              </Stack>
            </Paper>

            {/* Submit Button */}
            <Group justify="flex-end">
              {onCancel && (
                <Button
                  variant="default"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  {t('manage.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                color="green"
              >
                {isSubmitting 
                  ? (isEditMode ? t('addProblem.updatingProblem') : t('addProblem.addingProblem'))
                  : (isEditMode ? t('addProblem.updateProblemButton') : t('addProblem.addProblemButton'))
                }
              </Button>
            </Group>
          </Stack>
        </form>
      )}

      {/* Message Display */}
      {message && (
        <Alert
          color={message.type === 'success' ? 'green' : 'red'}
          icon={message.type === 'success' ? <IconCheck size={16} /> : <IconX size={16} />}
          mt="xl"
        >
          {message.text}
        </Alert>
      )}
    </Container>
  );
};

export default ProblemForm;
