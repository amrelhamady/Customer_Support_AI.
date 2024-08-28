'use client'
import { Box, Button, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import { useState } from "react";

export default function Home() {
  // State for storing messages
  const [messages, setMessages] = useState([
    {
      role: 'assistant', 
      content: 'Hi I am the Headstarter Support Agent, how can I help you today?'
    }
  ]);

  // State for the current message input
  const [message, setMessage] = useState('');

  // Send message function
  const sendMessage = async () => {
    // Ensure that the user message is added before making the POST request
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message }
    ];

    setMessages(updatedMessages); // Update the messages immediately
    setMessage(''); // Clear the input field

    // Make the API request
    try {
      const response = await fetch("/api/chat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }) // Send updated messages
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';

      const processText = async ({ done, value }) => {
        if (done) {
          return result;
        }

        const text = decoder.decode(value, { stream: true });
        
        // Update assistant's message incrementally
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          // Check if the last message is from the assistant, and update it incrementally
          if (lastMessage.role === 'assistant') {
            return [
              ...otherMessages,
              {
                ...lastMessage,
                content: lastMessage.content + text
              }
            ];
          } else {
            return [
              ...messages,
              { role: 'assistant', content: text }
            ];
          }
        });

        return reader.read().then(processText);
      };

      // Start processing the stream
      await reader.read().then(processText);

    } catch (error) {
      console.error("Error while fetching response:", error);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        {/* Stack for messages */}
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {/* Iterate over messages */}
          {messages.map((message, index) => (
            <Box
              key={index}
              display='flex'
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
