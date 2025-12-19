import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Box, Paper, Text, Table, Code, Title } from '@mantine/core';
import { useTheme } from '../contexts/ThemeContext';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

// Mermaid component that loads dynamically
const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const renderMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });
        
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    if (chart.trim()) {
      renderMermaid();
    }
  }, [chart]);

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Text c="red">Error rendering diagram: {error}</Text>
        <Code block mt="sm">{chart}</Code>
      </Paper>
    );
  }

  if (!svg) {
    return (
      <Paper p="md" withBorder>
        <Text>Loading diagram...</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </Paper>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { colorScheme } = useTheme();
  const components = {
    // Custom code block renderer with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');
      
      // Handle Mermaid diagrams
      if (language === 'mermaid') {
        return <MermaidChart chart={codeContent} />;
      }
      
      // Handle other code blocks with syntax highlighting
      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={atomDark}
            language={language}
            PreTag="div"
            {...props}
          >
            {codeContent}
          </SyntaxHighlighter>
        );
      }
      
      // Inline code
      return (
        <Code {...props}>
          {children}
        </Code>
      );
    },
    
    // Custom table renderer using Mantine Table
    table({ children }: any) {
      return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          {children}
        </Table>
      );
    },
    
    // Custom heading renderers using Mantine Title
    h1({ children }: any) {
      return (
        <Title order={1} mb="md" mt="xl">
          {children}
        </Title>
      );
    },
    
    h2({ children }: any) {
      return (
        <Title order={2} mb="md" mt="lg">
          {children}
        </Title>
      );
    },
    
    h3({ children }: any) {
      return (
        <Title order={3} mb="sm" mt="md">
          {children}
        </Title>
      );
    },
    
    h4({ children }: any) {
      return (
        <Title order={4} mb="sm" mt="md">
          {children}
        </Title>
      );
    },
    
    h5({ children }: any) {
      return (
        <Title order={5} mb="xs" mt="sm">
          {children}
        </Title>
      );
    },
    
    h6({ children }: any) {
      return (
        <Title order={6} mb="xs" mt="sm">
          {children}
        </Title>
      );
    },
    
    // Custom paragraph renderer
    p({ children }: any) {
      return (
        <Text mb="sm" style={{ lineHeight: 1.6 }}>
          {children}
        </Text>
      );
    },
    
    // Custom blockquote renderer
    blockquote({ children }: any) {
      return (
        <Paper 
          p="md" 
          withBorder 
          style={{ 
            borderLeft: '4px solid #339af0',
            backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
            color: colorScheme === 'dark' ? 'var(--mantine-color-gray-1)' : undefined
          }}
        >
          {children}
        </Paper>
      );
    }
  };

  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;