import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Chat from '../components/Chat';

test('renders highlighted code block', async () => {
  const messages = [
    {
      type: 'assistant',
      iteration_data: {
        first_model_response: '<pre><code class="language-js">const x = 10;</code></pre>',
      },
    },
  ];

  const { findByText } = render(<Chat messages={messages} onSendMessage={() => {}} />);

  const codeElement = await findByText('const x = 10;');
  expect(codeElement).toBeInTheDocument();
  expect(codeElement).toHaveClass('language-js');
});