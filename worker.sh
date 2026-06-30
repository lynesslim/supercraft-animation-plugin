#!/bin/bash
while true; do
  if [ -f DEEPSEEK_PROMPT.md ]; then
     echo "Antigravity dropped a new task! Sending to OpenCode..."
     
     # Automatically retry if DeepSeek servers are overloaded
     until yes | opencode run "Please read DEEPSEEK_PROMPT.md and execute its instructions to modify the animation plugin." < /dev/null; do
         echo "DeepSeek API experienced an error or high traffic. Retrying in 15 seconds..."
         sleep 15
     done
     
     mv DEEPSEEK_PROMPT.md DEEPSEEK_FINISHED.txt
  fi
  sleep 10
done
